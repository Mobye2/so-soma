/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '煦日之森'

interface Props {
  name?: string
  eventTitle?: string
}

const EventRegistrationEmail = ({ name, eventTitle }: Props) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>報名收到了｜{eventTitle ?? '活動'}・{SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `${name}，歡迎你` : '歡迎你'}</Heading>
        <Text style={text}>
          我們已收到你報名 <strong>{eventTitle ?? '活動'}</strong> 的訊息。
        </Text>
        <Section style={card}>
          <Text style={cardLabel}>下一步</Text>
          <Text style={cardText}>
            Kaia 將在活動前以 Email 或 Instagram 私訊與你確認集合地點、時間與當日注意事項。
            請留意你的收件匣，若一週內未收到請來信告知。
          </Text>
        </Section>
        <Text style={text}>
          在那之前，先讓自己準備好──一雙好走的鞋，一顆願意慢下來的心。
        </Text>
        <Text style={footer}>期待與你在森林相遇。<br/>{SITE_NAME}・Solis Forest</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EventRegistrationEmail,
  subject: (data) => `報名收到了｜${data.eventTitle ?? '活動'}・煦日之森`,
  displayName: '活動報名確認信',
  previewData: { name: '怡君', eventTitle: '森林療癒半日體驗' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 24px' }
const text = { fontSize: '15px', color: 'hsl(20, 10%, 45%)', lineHeight: '1.7', margin: '0 0 20px' }
const card = { backgroundColor: 'hsl(40, 33%, 96%)', borderLeft: '3px solid hsl(130, 22%, 33%)', padding: '16px 20px', borderRadius: '6px', margin: '8px 0 24px' }
const cardLabel = { fontSize: '12px', color: 'hsl(130, 22%, 33%)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 8px' }
const cardText = { fontSize: '14px', color: 'hsl(20, 30%, 18%)', lineHeight: '1.7', margin: '0' }
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.6' }
