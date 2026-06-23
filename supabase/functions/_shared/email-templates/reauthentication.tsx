/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>你的驗證碼</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>確認你的身份</Heading>
        <Text style={text}>請使用下方驗證碼確認你的身份：</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          此驗證碼將在短時間內過期。如果你沒有提出此請求，請忽略此封郵件。
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(130, 22%, 33%)',
  letterSpacing: '0.15em',
  margin: '0 0 32px',
}
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.6' }
