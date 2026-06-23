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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>確認你的煦日之森 Email 變更</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>確認 Email 變更</Heading>
        <Text style={text}>
          你已申請將煦日之森帳號的 Email 從{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          變更為{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          。
        </Text>
        <Text style={text}>請點擊下方按鈕確認此變更：</Text>
        <Button style={button} href={confirmationUrl}>
          確認變更
        </Button>
        <Text style={footer}>
          如果你沒有提出此變更，請立即確認你的帳號安全。
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
