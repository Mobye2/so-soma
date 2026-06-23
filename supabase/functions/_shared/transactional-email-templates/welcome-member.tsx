/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '煦日之森'
const SITE_URL = 'https://solisforest.com'

interface Props {
  name?: string
}

const WelcomeMemberEmail = ({ name }: Props) => (
  <Html lang="zh-Hant" dir="ltr">
    <Head />
    <Preview>歡迎來到 {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `${name}，歡迎回家` : '歡迎回家'}</Heading>
        <Text style={text}>
          很開心你加入 <Link href={SITE_URL} style={link}><strong>{SITE_NAME}</strong></Link>。
        </Text>
        <Text style={text}>
          在這裡，我們相信改變不來自「學更多」，而來自一次又一次帶著覺察的練習。
          每一次的呼吸、每一步踩進森林的腳，都是與自己重新連結的機會。
        </Text>
        <Text style={text}>
          以下是幾個你可以開始的地方：
        </Text>
        <Text style={listItem}>・<Link href={`${SITE_URL}/courses`} style={link}>線上課程</Link>──在家也能練習的引導音檔與影片</Text>
        <Text style={listItem}>・<Link href={`${SITE_URL}/events`} style={link}>實體活動</Link>──走進森林、走進瑜珈墊的真實體驗</Text>
        <Text style={listItem}>・<Link href={`${SITE_URL}/ebooks`} style={link}>電子書</Link>──Kaia 寫給疲憊靈魂的文字陪伴</Text>
        <Button style={button} href={SITE_URL}>探索 {SITE_NAME}</Button>
        <Text style={footer}>願這段旅程，是你重新回到自己的開始。<br/>Kaia ＆ Owen</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeMemberEmail,
  subject: '歡迎回家｜煦日之森',
  displayName: '會員註冊歡迎信',
  previewData: { name: '怡君' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 24px' }
const text = { fontSize: '15px', color: 'hsl(20, 10%, 45%)', lineHeight: '1.7', margin: '0 0 16px' }
const listItem = { fontSize: '14px', color: 'hsl(20, 10%, 45%)', lineHeight: '1.8', margin: '0 0 6px' }
const link = { color: 'hsl(130, 22%, 33%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(130, 22%, 33%)', color: 'hsl(40, 33%, 96%)', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block', margin: '16px 0 24px' }
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '32px 0 0', lineHeight: '1.6' }
