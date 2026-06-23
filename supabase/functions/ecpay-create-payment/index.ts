import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeMerchantId(value: string | undefined): string {
  const raw = value?.replace(/\r/g, "").trim() ?? "";
  if (!raw) return "";

  const matches = raw.match(/[A-Za-z0-9]+/g);
  return (matches?.at(-1) ?? raw).trim();
}

function normalizeSecretValue(value: string | undefined): string {
  const raw = value?.replace(/\r/g, "").trim() ?? "";
  if (!raw) return "";

  const lineSegments = raw
    .split(/[\n\t]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const lastSegment = lineSegments.at(-1) ?? raw;
  const colonSegments = lastSegment
    .split(/[：:]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return (colonSegments.at(-1) ?? lastSegment).replace(/\s+/g, "");
}

function generateCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): string {
  // Step 1: Sort by key alphabetically
  const sorted = Object.keys(params)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  // Step 2: Add HashKey and HashIV
  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;

  // Step 3: URL encode and lowercase
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%20/g, "+");

  // Step 4: SHA256 hash and uppercase
  const encoder = new TextEncoder();
  const data = encoder.encode(encoded);
  const hashBuffer = new Uint8Array(
    // deno-lint-ignore no-explicit-any
    (crypto as any).subtle ? [] : []
  );

  // Use Web Crypto API
  return crypto.subtle
    .digest("SHA-256", data)
    .then((buf) => {
      const hashArray = Array.from(new Uint8Array(buf));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    }) as unknown as string;
}

async function generateCheckMacValueAsync(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): Promise<string> {
  const sorted = Object.keys(params)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const raw = `HashKey=${hashKey}&${sorted}&HashIV=${hashIV}`;

  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%20/g, "+");

  const data = new TextEncoder().encode(encoded);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order items (may be empty for event-only orders)
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    // Also check event registrations for this order
    const { data: eventRegs } = await supabase
      .from("event_registrations")
      .select("event_type")
      .eq("customer_email", order.customer_email)
      .order("created_at", { ascending: false })
      .limit(5);

    // Build item name - use ASCII-safe names for ECPay compatibility
    let itemNames = "";
    if (items && items.length > 0) {
      itemNames = items.map((i: { product_title: string; quantity: number }) => `${i.product_title} x${i.quantity}`).join("#");
    } else {
      // For event orders, use order customer name as context
      itemNames = "Event Registration";
    }

    const merchantIdRaw = Deno.env.get("ECPAY_MERCHANT_ID");
    const hashKeyRaw = Deno.env.get("ECPAY_HASH_KEY");
    const hashIVRaw = Deno.env.get("ECPAY_HASH_IV");

    const merchantId = normalizeMerchantId(merchantIdRaw);
    const hashKey = normalizeSecretValue(hashKeyRaw);
    const hashIV = normalizeSecretValue(hashIVRaw);

    if (!merchantId || !hashKey || !hashIV) {
      throw new Error("Missing or invalid ECPay credentials");
    }

    console.log("=== ECPay Debug ===");
    console.log("MerchantID:", merchantId);
    console.log("MerchantID sanitized:", merchantId !== (merchantIdRaw ?? ""));
    console.log("HashKey sanitized:", hashKey !== (hashKeyRaw ?? ""));
    console.log("HashIV sanitized:", hashIV !== (hashIVRaw ?? ""));
    console.log("MerchantID length:", merchantId.length);
    console.log("HashKey length:", hashKey.length);
    console.log("HashIV length:", hashIV.length);

    const now = new Date();
    const merchantTradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const tradeNo = `SOL${Date.now()}`;

    const siteUrl = req.headers.get("origin") || "https://id-preview--be345289-9536-4667-8712-d61d88d703a4.lovable.app";
    const functionBaseUrl = `${supabaseUrl}/functions/v1`;

    const params: Record<string, string> = {
      MerchantID: merchantId,
      MerchantTradeNo: tradeNo,
      MerchantTradeDate: merchantTradeDate,
      PaymentType: "aio",
      TotalAmount: String(order.total_amount),
      TradeDesc: "Solis Online Order",
      ItemName: itemNames.substring(0, 200),
      ReturnURL: `${functionBaseUrl}/ecpay-callback`,
      OrderResultURL: `${siteUrl}/order-success?orderId=${orderId}`,
      ChoosePayment: "Credit",
      EncryptType: "1",
      CustomField1: orderId,
    };

    console.log("=== ECPay Params (before MAC) ===", JSON.stringify(params, null, 2));

    const checkMacValue = await generateCheckMacValueAsync(params, hashKey, hashIV);
    params.CheckMacValue = checkMacValue;

    console.log("=== CheckMacValue ===", checkMacValue);
    console.log("=== Final Params ===", JSON.stringify(params, null, 2));

    // Update order with trade number
    await supabase
      .from("orders")
      .update({ notes: `ECPay TradeNo: ${tradeNo}${order.notes ? ` | ${order.notes}` : ""}` })
      .eq("id", orderId);

    // ECPay API endpoint (production)
    const ecpayUrl = "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5";

    return new Response(
      JSON.stringify({
        paymentUrl: ecpayUrl,
        params,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("ECPay create payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
