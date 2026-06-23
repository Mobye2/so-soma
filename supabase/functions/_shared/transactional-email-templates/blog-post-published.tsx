/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '煦日之森'

interface Props {
  title: string
  slug: string
  publishedAt: string
  url: string
  category?: string
  excerpt?: string
}

const BlogPostPublishedEmail = ({ title, slug, publishedAt, url, category, excerpt }: Props) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>文章已上線：{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={badge}>BLOG · 排程文章已上線</Text>
        <Heading style={h1}>{title}</Heading>
        {category && <Text style={meta}>分類：{category}</Text>}
        {excerpt && <Text style={text}>{excerpt}</Text>}

        <Section style={card}>
          <Text style={label}>網址 Slug</Text>
          <Text style={value}>{slug}</Text>
          <Hr style={hr} />
          <Text style={label}>上線時間</Text>
          <Text style={value}>{publishedAt}</Text>
          <Hr style={hr} />
          <Text style={label}>文章連結</Text>
          <Text style={value}>{url}</Text>
        </Section>

        <Section style={{ textAlign: 'center' as const, margin: '28px 0 8px' }}>
          <Button href={url} style={button}>立即查看文章</Button>
        </Section>

        <Text style={footer}>{SITE_NAME}・自動通知系統</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BlogPostPublishedEmail,
  subject: (d: Record<string, any>) => `[煦日之森] 文章已上線：${d?.title ?? ''}`,
  displayName: '部落格文章上線通知',
  to: 'believe.chuan@gmail.com',
  previewData: {
    title: '什麼是多重迷走神經理論？理解你的三種神經狀態',
    slug: 'polyvagal-theory-explained',
    publishedAt: '2026-10-30 00:10',
    url: 'https://www.solisforest.com/blog/polyvagal-theory-explained',
    category: '神經系統科普',
    excerpt: '本文用淺白語言介紹多重迷走神經理論…',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const badge = { fontSize: '11px', letterSpacing: '0.18em', color: 'hsl(122, 15%, 42%)', margin: '0 0 12px', textTransform: 'uppercase' as const }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 12px', lineHeight: '1.5' }
const meta = { fontSize: '13px', color: 'hsl(122, 15%, 42%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 10%, 45%)', lineHeight: '1.7', margin: '0 0 20px' }
const card = { backgroundColor: 'hsl(40, 30%, 96%)', borderRadius: '8px', padding: '20px 22px', margin: '20px 0' }
const label = { fontSize: '11px', color: 'hsl(20, 10%, 55%)', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' as const }
const value = { fontSize: '14px', color: 'hsl(20, 30%, 18%)', margin: '0 0 4px', wordBreak: 'break-all' as const }
const hr = { borderColor: 'hsl(40, 20%, 86%)', margin: '12px 0' }
const button = { backgroundColor: 'hsl(122, 20%, 36%)', color: '#ffffff', padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' as const }
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.6', textAlign: 'center' as const }
