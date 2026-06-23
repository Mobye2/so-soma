/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '煦日之森'

interface Props {
  name?: string
  subject?: string
}

const ContactConfirmationEmail = ({ name, subject }: Props) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>我們已收到你的訊息｜{SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `${name}，謝謝你` : '謝謝你的來訊'}</Heading>
        <Text style={text}>
          我們已收到你寄給 <strong>{SITE_NAME}</strong> 的訊息{subject ? `（主旨：${subject}）` : ''}。
        </Text>
        <Text style={text}>
          我們會在 2 個工作天內回覆你。若是急件，也歡迎在 Instagram 上私訊 Kaia（@for_rest_journey）。
        </Text>
        <Text style={text}>願你今日有片刻能慢下來，深深呼吸。</Text>
        <Text style={footer}>{SITE_NAME}・Solis Forest</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: '我們已收到你的訊息｜煦日之森',
  displayName: '聯絡表單確認信',
  previewData: { name: '怡君', subject: '想了解森林療癒課程' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 24px' }
const text = { fontSize: '15px', color: 'hsl(20, 10%, 45%)', lineHeight: '1.7', margin: '0 0 20px' }
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.6' }
