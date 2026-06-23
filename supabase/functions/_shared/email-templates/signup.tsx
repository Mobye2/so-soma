/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>歡迎來到煦日之森，請確認您的 Email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>歡迎回家</Heading>
        <Text style={text}>
          感謝你加入{' '}
          <Link href={siteUrl} style={link}>
            <strong>煦日之森</strong>
          </Link>
          。在這裡，我們相信改變不來自「學更多」，而來自一次又一次帶著覺察的練習。
        </Text>
        <Text style={text}>
          請點擊下方按鈕，確認你的 Email（
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ）：
        </Text>
        <Button style={button} href={confirmationUrl}>
          確認 Email
        </Button>
        <Text style={footer}>
          如果你沒有註冊，請忽略此封郵件。
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'hsl(130, 22%, 33%)', textDecoration: 'underline' }
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
