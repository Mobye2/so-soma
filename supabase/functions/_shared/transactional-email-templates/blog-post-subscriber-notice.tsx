/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '煦日之森'

interface Props {
  title: string
  url: string
  author?: string
  category?: string
  excerpt?: string
  unsubscribeUrl?: string
}

const BlogPostSubscriberNoticeEmail = ({ title, url, author, category, excerpt, unsubscribeUrl }: Props) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>{`新文章上線：${title}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={badge}>煦日之森・新文章上線</Text>
        <Heading style={h1}>{title}</Heading>
        <Text style={meta}>
          {author ? `文｜${author}` : '文｜煦日之森'}
          {category ? `　·　#${category}` : ''}
        </Text>
        {excerpt && <Text style={text}>{excerpt}</Text>}

        <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
          <Button href={url} style={button}>閱讀全文</Button>
        </Section>

        <Text style={footer}>
          你訂閱了 {SITE_NAME} 的部落格更新，當有新的身心療癒文章上線時會收到這封通知。
          {unsubscribeUrl && (
            <>
              {' '}
              <Link href={unsubscribeUrl} style={link}>取消訂閱</Link>
            </>
          )}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BlogPostSubscriberNoticeEmail,
  subject: (d: Record<string, any>) => `[煦日之森] 新文章：${d?.title ?? ''}`,
  displayName: '部落格訂閱者新文章通知',
  previewData: {
    title: '什麼是多重迷走神經理論？理解你的三種神經狀態',
    url: 'https://www.solisforest.com/blog/polyvagal-theory-explained',
    author: 'Kaia',
    category: '神經系統科普',
    excerpt: '本文用淺白語言介紹多重迷走神經理論，幫助你看懂自律神經的訊號…',
    unsubscribeUrl: 'https://www.solisforest.com/unsubscribe?email=demo@example.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const badge = { fontSize: '11px', letterSpacing: '0.18em', color: 'hsl(122, 15%, 42%)', margin: '0 0 12px', textTransform: 'uppercase' as const }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 12px', lineHeight: '1.5' }
const meta = { fontSize: '13px', color: 'hsl(122, 15%, 42%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: 'hsl(20, 10%, 35%)', lineHeight: '1.8', margin: '0 0 20px' }
const button = { backgroundColor: 'hsl(122, 20%, 36%)', color: '#ffffff', padding: '12px 32px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' as const }
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.7', textAlign: 'center' as const }
const link = { color: 'hsl(122, 20%, 36%)', textDecoration: 'underline' }
