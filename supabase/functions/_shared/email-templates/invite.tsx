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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>邀請你加入煦日之森</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>你被邀請了</Heading>
        <Text style={text}>
          有人邀請你加入{' '}
          <Link href={siteUrl} style={link}>
            <strong>煦日之森</strong>
          </Link>
          。點擊下方按鈕接受邀請並建立你的帳號。
        </Text>
        <Button style={button} href={confirmationUrl}>
          接受邀請
        </Button>
        <Text style={footer}>
          如果你不認識這封郵件，可以安心忽略。
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
