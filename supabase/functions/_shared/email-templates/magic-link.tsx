/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>你的煦日之森登入連結</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>你的登入連結</Heading>
        <Text style={text}>
          點擊下方按鈕即可登入煦日之森。此連結將在短時間內過期。
        </Text>
        <Button style={button} href={confirmationUrl}>
          登入
        </Button>
        <Text style={footer}>
          如果你沒有提出此請求，請忽略此封郵件。
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: 'hsl(20, 30%, 12%)',
  margin: '0 0 24px',
  fontFamily: "'Noto Serif TC', serif",
}
const text = {
  fontSize: '15px',
  color: 'hsl(20, 10%, 45%)',
  lineHeight: '1.7',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: 'hsl(130, 22%, 33%)',
  color: 'hsl(40, 33%, 96%)',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 24px',
}
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.6' }
