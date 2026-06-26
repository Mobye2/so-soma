import json
import os
import re
import uuid
from typing import Dict, List, Optional, Any
from supabase import create_client, Client
from jose import jwt, JWTError
import boto3


def is_uuid(value: str) -> bool:
    """Check if string is a valid UUID"""
    return bool(re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', value, re.I))


def get_supabase_client() -> Client:
    """Get Supabase client with service role"""
    url = os.environ.get('SUPABASE_URL')
    service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not service_key:
        raise ValueError("Missing Supabase credentials")
    return create_client(url, service_key)


def validate_cognito_token(auth_header: str, customer_email: str) -> bool:
    """Validate Cognito JWT token and check email match"""
    if not auth_header.startswith('Bearer '):
        return False
    
    token = auth_header.replace('Bearer ', '')
    try:
        # Decode without verification for now (add JWKS verification in production)
        payload = jwt.decode(token, options={"verify_signature": False})
        token_email = payload.get('email', '').lower()
        return token_email == customer_email.strip().lower()
    except JWTError:
        return False


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for create-order"""
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, content-type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        }

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        customer_name = (body.get('customer_name') or '').strip()
        customer_email = (body.get('customer_email') or '').strip()
        customer_phone = (body.get('customer_phone') or '').strip()
        notes = (body.get('notes') or '').strip()
        items = body.get('items', [])

        # Basic validation
        if not customer_name or not customer_email or not isinstance(items, list) or len(items) == 0:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid payload'})
            }

        # Validate items
        for item in items:
            if (not item or 
                not isinstance(item.get('id'), str) or 
                not isinstance(item.get('title'), str) or
                not isinstance(item.get('quantity'), (int, float)) or
                not isinstance(item.get('price'), (int, float)) or
                item['quantity'] <= 0 or 
                item['price'] < 0 or 
                item['quantity'] > 999 or 
                item['price'] > 1_000_000):
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Invalid item'})
                }

        # Check JWT auth if present
        auth_header = event.get('headers', {}).get('Authorization', '')
        if auth_header and not validate_cognito_token(auth_header, customer_email):
            return {
                'statusCode': 403,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Email does not match signed-in user'})
            }

        supabase = get_supabase_client()

        # Re-price products against DB (prevent tampering)
        product_items = [item for item in items if is_uuid(item['id']) and item.get('category') != 'event']
        price_map = {}
        title_map = {}

        if product_items:
            product_ids = [item['id'] for item in product_items]
            result = supabase.table('products').select('id, title, price').in_('id', product_ids).execute()
            
            for product in result.data:
                price_map[product['id']] = int(product['price'])
                title_map[product['id']] = product['title']
            
            # Check all products exist
            for item in product_items:
                if item['id'] not in price_map:
                    return {
                        'statusCode': 400,
                        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Product not found'})
                    }

        # Calculate total with server-side pricing
        total = 0
        for item in items:
            unit_price = price_map.get(item['id'], item['price'])
            total += unit_price * item['quantity']

        # Create order
        order_id = str(uuid.uuid4())
        order_data = {
            'id': order_id,
            'customer_name': customer_name[:200],
            'customer_email': customer_email[:200],
            'customer_phone': customer_phone[:50] or None,
            'total_amount': total,
            'notes': notes[:2000] or None,
            'payment_method': 'ecpay',
            'user_id': body.get('user_id') or None,
        }
        
        supabase.table('orders').insert(order_data).execute()

        # Insert order items for products
        if product_items:
            order_items = []
            for item in product_items:
                order_items.append({
                    'order_id': order_id,
                    'product_id': item['id'],
                    'product_title': title_map.get(item['id'], item['title']),
                    'quantity': item['quantity'],
                    'unit_price': price_map[item['id']]
                })
            supabase.table('order_items').insert(order_items).execute()

        # Handle event registrations
        event_items = [item for item in items if item.get('category') == 'event']
        if event_items:
            registrations = []
            for item in event_items:
                registrations.append({
                    'customer_name': customer_name,
                    'customer_email': customer_email,
                    'customer_phone': customer_phone,
                    'event_type': item['id'],
                    'notes': notes or None
                })
            supabase.table('event_registrations').insert(registrations).execute()

            # Send event confirmation emails via Lambda invoke
            try:
                lambda_client = boto3.client('lambda')
                for item in event_items:
                    payload = {
                        'httpMethod': 'POST',
                        'body': json.dumps({
                            'templateName': 'event-registration-confirmation',
                            'recipientEmail': customer_email,
                            'idempotencyKey': f'event-reg-{order_id}-{item["id"]}',
                            'templateData': {'name': customer_name, 'eventTitle': item['title']},
                        }),
                    }
                    lambda_client.invoke(
                        FunctionName=os.environ.get('SEND_EMAIL_FUNCTION_NAME', 'solis-backend-SendTransactionalEmailFunction'),
                        InvocationType='Event',
                        Payload=json.dumps(payload),
                    )
            except Exception as email_err:
                print(f'Event email failed: {email_err}')

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'orderId': order_id, 'total': total})
        }

    except Exception as e:
        print(f"create-order error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }