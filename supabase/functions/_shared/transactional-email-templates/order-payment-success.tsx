/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Row, Column, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '煦日之森'

interface OrderItem {
  title: string
  quantity: number
  unit_price: number
}

interface Props {
  name?: string
  orderId?: string
  totalAmount?: number
  items?: OrderItem[]
}

const formatPrice = (n: number) => `NT$${n.toLocaleString()}`

const OrderPaymentSuccessEmail = ({ name, orderId, totalAmount, items }: Props) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>付款成功｜訂單 {orderId ?? ''}・{SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `${name}，付款成功` : '付款成功'}</Heading>
        <Text style={text}>
          感謝你的購買。我們已收到你的款項，訂單正在處理中。
        </Text>

        {orderId && (
          <Section style={card}>
            <Text style={cardLabel}>訂單編號</Text>
            <Text style={cardText}>{orderId}</Text>
          </Section>
        )}

        {items && items.length > 0 && (
          <Section style={{ margin: '0 0 24px' }}>
            <Text style={sectionTitle}>訂購項目</Text>
            <Hr style={hr} />
            {items.map((item, i) => (
              <Row key={i} style={{ margin: '0 0 8px' }}>
                <Column style={{ verticalAlign: 'top' }}>
                  <Text style={itemTitle}>{item.title}</Text>
                  <Text style={itemQty}>數量 × {item.quantity}</Text>
                </Column>
                <Column align="right" style={{ verticalAlign: 'top' }}>
                  <Text style={itemPrice}>{formatPrice(item.unit_price * item.quantity)}</Text>
                </Column>
              </Row>
            ))}
            <Hr style={hr} />
          </Section>
        )}

        {totalAmount !== undefined && (
          <Row style={{ margin: '0 0 24px' }}>
            <Column><Text style={totalLabel}>總金額</Text></Column>
            <Column align="right"><Text style={totalValue}>{formatPrice(totalAmount)}</Text></Column>
          </Row>
        )}

        <Text style={text}>
          若是課程或電子書，將由 Kaia 親自寄送觀看連結；若是實體活動，我們會在活動前與你確認細節。
        </Text>
        <Text style={footer}>謝謝你的支持。<br/>{SITE_NAME}・Solis Forest</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderPaymentSuccessEmail,
  subject: (data) => `付款成功｜訂單 ${data.orderId ?? ''}・煦日之森`,
  displayName: '訂單付款成功通知',
  previewData: {
    name: '怡君',
    orderId: 'a1b2c3d4',
    totalAmount: 2400,
    items: [
      { title: '森林療癒半日體驗', quantity: 2, unit_price: 1200 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 24px' }
const text = { fontSize: '15px', color: 'hsl(20, 10%, 45%)', lineHeight: '1.7', margin: '0 0 20px' }
const card = { backgroundColor: 'hsl(40, 33%, 96%)', borderLeft: '3px solid hsl(130, 22%, 33%)', padding: '12px 20px', borderRadius: '6px', margin: '0 0 24px' }
const cardLabel = { fontSize: '11px', color: 'hsl(130, 22%, 33%)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const cardText = { fontSize: '14px', color: 'hsl(20, 30%, 18%)', margin: '0', fontFamily: 'monospace' }
const sectionTitle = { fontSize: '13px', color: 'hsl(20, 30%, 18%)', fontWeight: '600' as const, margin: '0 0 8px' }
const hr = { borderColor: 'hsl(40, 20%, 88%)', margin: '8px 0' }
const itemTitle = { fontSize: '14px', color: 'hsl(20, 30%, 18%)', margin: '0' }
const itemQty = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '2px 0 0' }
const itemPrice = { fontSize: '14px', color: 'hsl(20, 30%, 18%)', margin: '0' }
const totalLabel = { fontSize: '15px', color: 'hsl(20, 30%, 18%)', fontWeight: '600' as const, margin: '0' }
const totalValue = { fontSize: '18px', color: 'hsl(130, 22%, 33%)', fontWeight: '600' as const, margin: '0' }
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.6' }
