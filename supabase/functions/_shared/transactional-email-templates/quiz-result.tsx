/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = '煦日之森'
const ASSET_BASE = 'https://www.solisforest.com'

interface DimScore { name: string; pct: number }
interface DimInsight { name: string; pct: number; level?: string; insight?: string; tip?: string }
interface Nutrient { lbl: string; body: string }
interface Pal { name: string; img: string; reason: string }
interface Tip { t: string; b: string }

interface Props {
  stateName?: string
  stateTitle?: string
  avgWell?: number
  topDim?: DimScore
  lowDim?: DimScore
  dims?: DimScore[]
  pctSym?: number
  pctDor?: number
  pctVen?: number
  firstTipTitle?: string
  firstTipBody?: string
  // Plant character
  plantName?: string
  plantTagline?: string
  plantHashtags?: string[]
  plantBodyVoice?: string
  plantSharePct?: number
  plantNutrients?: Nutrient[]
  plantFriend?: Pal
  plantStranger?: Pal
  // Full results
  dimInsights?: DimInsight[]
  stateTips?: Tip[]
}

const PLANT_IMG: Record<string, string> = {
  '多肉': `${ASSET_BASE}/quiz-plant-succulent.png`,
  '捕蠅草': `${ASSET_BASE}/quiz-plant-venus.png`,
  '苔蘚': `${ASSET_BASE}/quiz-plant-moss.png`,
}

const palImg = (p?: Pal) => {
  if (!p) return ''
  if (p.img && p.img.startsWith('http')) return p.img
  if (p.img && p.img.startsWith('/')) return `${ASSET_BASE}${p.img}`
  return PLANT_IMG[p.name] || ''
}

const QuizResultEmail = ({
  stateName = '安穩在線',
  stateTitle = '你的神經系統目前在安全窗口裡',
  avgWell = 0,
  topDim,
  lowDim,
  dims = [],
  pctSym = 0,
  pctDor = 0,
  pctVen = 0,
  firstTipTitle,
  firstTipBody,
  plantName = '多肉',
  plantTagline = '',
  plantHashtags = [],
  plantBodyVoice = '',
  plantSharePct = 0,
  plantNutrients = [],
  plantFriend,
  plantStranger,
  dimInsights = [],
  stateTips = [],
}: Props) => {
  const heroImg = PLANT_IMG[plantName] || PLANT_IMG['多肉']
  return (
    <Html lang="zh-Hant" dir="ltr">
      <Head />
      <Preview>你的身體最像哪一種植物｜{plantName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>神經系統身心狀態全景測驗</Text>
          <Heading style={h1}>你的測驗結果</Heading>

          {/* Hero — plant character */}
          <Section style={heroCard}>
            <Img src={heroImg} alt={plantName} width="120" height="120" style={heroImg2} />
            <Text style={heroLabel}>你的身體目前最像哪一種植物…</Text>
            <Text style={heroName}>{plantName}</Text>
            {plantTagline && <Text style={heroTagline}>{plantTagline}</Text>}
            {plantHashtags.length > 0 && (
              <Text style={heroTags}>{plantHashtags.join('　')}</Text>
            )}
            <Text style={heroSub}>
              整體穩定度 {avgWell}%　·　約 {plantSharePct}% 的人和你是同款植物
            </Text>
          </Section>

          {/* Body voice */}
          {plantBodyVoice && (
            <Section style={voiceBox}>
              <Text style={voiceLbl}>🌿 身體想跟你說</Text>
              <Text style={voiceBody}>{plantBodyVoice}</Text>
            </Section>
          )}

          {/* Top / Low dims */}
          {(topDim || lowDim) && (
            <Section style={twoCol}>
              {topDim && (
                <Section style={cell}>
                  <Text style={cellLbl}>最有力的部分</Text>
                  <Text style={cellMain}>{topDim.name}</Text>
                  <Text style={cellSub}>{topDim.pct}% 穩定</Text>
                </Section>
              )}
              {lowDim && (
                <Section style={cell}>
                  <Text style={cellLbl}>最想被照顧</Text>
                  <Text style={cellMain}>{lowDim.name}</Text>
                  <Text style={cellSub}>{lowDim.pct}% 穩定</Text>
                </Section>
              )}
            </Section>
          )}

          {/* Nutrients */}
          {plantNutrients.length > 0 && (
            <>
              <Heading as="h2" style={h2}>🌱 適合你的養分</Heading>
              {plantNutrients.map((n, i) => (
                <Section key={i} style={nutriRow}>
                  <Text style={nutriLbl}>{n.lbl}</Text>
                  <Text style={nutriBody}>{n.body}</Text>
                </Section>
              ))}
            </>
          )}

          {/* Pals */}
          {(plantFriend || plantStranger) && (
            <>
              <Heading as="h2" style={h2}>🪴 與你的關係</Heading>
              {plantFriend && (
                <Section style={palRow}>
                  <Img src={palImg(plantFriend)} alt={plantFriend.name} width="48" height="48" style={palImgStyle} />
                  <Text style={palText}>
                    <span style={palLbl}>合拍植物</span>
                    <br />
                    <span style={palName}>{plantFriend.name}</span>
                    <br />
                    <span style={palReason}>{plantFriend.reason}</span>
                  </Text>
                </Section>
              )}
              {plantStranger && (
                <Section style={palRow}>
                  <Img src={palImg(plantStranger)} alt={plantStranger.name} width="48" height="48" style={palImgStyle} />
                  <Text style={palText}>
                    <span style={palLbl}>暫時不合拍</span>
                    <br />
                    <span style={palName}>{plantStranger.name}</span>
                    <br />
                    <span style={palReason}>{plantStranger.reason}</span>
                  </Text>
                </Section>
              )}
            </>
          )}

          {/* First tip */}
          {firstTipTitle && (
            <Section style={tipBox}>
              <Text style={tipLbl}>今天可以做的一件事</Text>
              <Text style={tipTitle}>{firstTipTitle}</Text>
              {firstTipBody && <Text style={tipBody}>{firstTipBody}</Text>}
            </Section>
          )}

          <Hr style={hr} />

          {/* Five-dim panorama */}
          <Heading as="h2" style={h2}>五個向度全景</Heading>
          {(dimInsights.length > 0 ? dimInsights : dims).map((d) => (
            <Section key={d.name} style={dimRowFull}>
              <Text style={dimRowHd}>
                <span style={dimName}>{d.name}</span>
                <span style={dimPct}>{d.pct}%</span>
              </Text>
              <Section style={dimTrack}>
                <Section style={{ ...dimFill, width: `${d.pct}%` }} />
              </Section>
              {(d as DimInsight).insight && (
                <Text style={dimInsightTxt}>{(d as DimInsight).insight}</Text>
              )}
              {(d as DimInsight).tip && (
                <Text style={dimTipTxt}>今日可以嘗試：{(d as DimInsight).tip}</Text>
              )}
            </Section>
          ))}

          <Hr style={hr} />

          {/* State composition */}
          <Heading as="h2" style={h2}>整體神經狀態組成</Heading>
          <Text style={stateLine}>備戰狀態　{pctSym}%</Text>
          <Text style={stateLine}>低電狀態　{pctDor}%</Text>
          <Text style={stateLine}>安穩狀態　{pctVen}%</Text>
          <Text style={stateSubLine}>{stateName}　·　{stateTitle}</Text>

          {/* Full state tips */}
          {stateTips.length > 0 && (
            <>
              <Hr style={hr} />
              <Heading as="h2" style={h2}>整體神經狀態的身心調適建議</Heading>
              {stateTips.map((t, i) => (
                <Section key={i} style={fullTipBox}>
                  <Text style={fullTipTitle}>{t.t}</Text>
                  <Text style={fullTipBody}>{t.b}</Text>
                </Section>
              ))}
            </>
          )}

          <Hr style={hr} />

          <Section style={kaiaBox}>
            <Text style={kaiaLbl}>KAIA 給你的悄悄話</Text>
            <Text style={kaiaBody}>
              你或許沒有察覺，但在剛剛回答這 15 道題的時候，你已經在做身體覺察了。每一次停下來感受「我現在是不是這樣」，都是身體與你對話的瞬間。這份能力本來就在你身上，你只是重新練習傾聽它。看見，就是改變的開始。
            </Text>
          </Section>

          <Text style={disclaimer}>
            這份測驗依據多重迷走神經理論設計，是自我探索的參考工具，無法取代專業心理健康評估。如果你的狀態已持續困擾日常生活，建議尋求專業心理師協助。
          </Text>

          <Text style={footer}>{SITE_NAME}・Solis Forest</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: QuizResultEmail,
  subject: (data: Record<string, any>) =>
    `你的身體最像哪一種植物｜${data?.plantName ?? '煦日之森'}`,
  displayName: '神經系統測驗結果（植物角色）',
  previewData: {
    stateName: '低電量關機',
    stateTitle: '你的神經系統正在靜止自保',
    avgWell: 42,
    topDim: { name: '社會連結', pct: 68 },
    lowDim: { name: '身體感知', pct: 22 },
    dims: [
      { name: '身體感知', pct: 22 },
      { name: '情緒調節', pct: 38 },
      { name: '思維模式', pct: 45 },
      { name: '行為模式', pct: 36 },
      { name: '社會連結', pct: 68 },
    ],
    pctSym: 18, pctDor: 60, pctVen: 22,
    firstTipTitle: '從微小動作開始，不要強迫大目標',
    firstTipBody: '凍結狀態下，大目標只會加重無力感。試試每天只做一件很小的事：曬 5 分鐘太陽、喝一杯溫水、感覺腳踩在地上。',
    plantName: '苔蘚',
    plantTagline: '趴在地上，安靜潮濕，不長高也不開花，把自己縮到很小很小。',
    plantHashtags: ['#節能模式', '#安靜回神', '#慢慢來就好'],
    plantBodyVoice: '「我這陣子有點累，所以暫時把音量關小了。不是不在乎，是我需要一點時間慢慢回來。可以陪我走小小的一步就好嗎？」',
    plantSharePct: 22,
    plantNutrients: [
      { lbl: '適合的環境', body: '溫暖、潮濕、不被打擾的角落。一杯熱水、一張毛毯、一束陽光就夠。' },
      { lbl: '適合的練習', body: '曬 5 分鐘太陽、哼長音「嗯—」、雙手搓熱放胸口。微小到不會抗拒的動作。' },
      { lbl: '要避開的事', body: '別逼自己振作或設大目標。苔蘚不需要開花也是植物。' },
    ],
    plantFriend: { name: '多肉', img: '/quiz-plant-succulent.png', reason: '對方不會逼你做什麼，只是穩穩地在旁邊' },
    plantStranger: { name: '捕蠅草', img: '/quiz-plant-venus.png', reason: '對方的高警戒節奏對現在的你來說太快了' },
    dimInsights: [
      { name: '身體感知', pct: 22, insight: '你的身體目前正以緊繃和敏感傳遞過載的訊號。', tip: '每天練習 2 分鐘身體掃描。' },
      { name: '情緒調節', pct: 38, insight: '情緒系統高度敏感。', tip: '試試情緒命名練習。' },
      { name: '思維模式', pct: 45, insight: '思維有些摩擦感。', tip: '試試三件事法則。' },
      { name: '行為模式', pct: 36, insight: '行為節奏不規律。', tip: '建立固定的休息儀式。' },
      { name: '社會連結', pct: 68, insight: '社會連結感穩固。', tip: '深化安全連結的質量。' },
    ],
    stateTips: [
      { t: '從微小動作開始', b: '凍結狀態下，大目標只會加重無力感。' },
      { t: '用溫度與觸覺喚醒神經系統', b: '溫水澡、熱敷包，溫暖的觸覺能傳遞安全訊號。' },
      { t: '哼唱或發聲，啟動迷走神經', b: '輕輕哼唱、振動喉嚨發出長長的「嗯」音。' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Serif TC', 'PingFang TC', 'Microsoft JhengHei', '微軟正黑體', 'Heiti TC', serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const eyebrow = { fontSize: '11px', fontWeight: '600' as const, letterSpacing: '0.12em', color: 'hsl(20, 10%, 55%)', margin: '0 0 8px', textTransform: 'uppercase' as const }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 24px' }
const h2 = { fontSize: '14px', fontWeight: '600' as const, color: 'hsl(20, 30%, 12%)', letterSpacing: '0.05em', margin: '20px 0 12px' }

const heroCard = { backgroundColor: '#FBF7F0', border: '1px solid #D9CFBF', borderRadius: '14px', padding: '20px 22px 22px', margin: '0 0 14px', textAlign: 'center' as const }
const heroImg2 = { display: 'block', margin: '0 auto 8px' }
const heroLabel = { fontSize: '12px', color: 'hsl(20, 10%, 45%)', margin: '0 0 4px' }
const heroName = { fontSize: '32px', fontWeight: '900' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 6px', lineHeight: '1.2', letterSpacing: '0.02em' }
const heroTagline = { fontSize: '13px', color: 'hsl(20, 10%, 35%)', margin: '0 0 8px', lineHeight: '1.6' }
const heroTags = { fontSize: '12px', fontWeight: '600' as const, color: 'hsl(160, 35%, 28%)', margin: '0 0 10px' }
const heroSub = { fontSize: '12px', color: 'hsl(20, 10%, 45%)', margin: 0, lineHeight: '1.6' }

const voiceBox = { backgroundColor: '#fff', border: '1px solid #E8DFCC', borderRadius: '12px', padding: '12px 14px', margin: '0 0 14px' }
const voiceLbl = { fontSize: '11px', fontWeight: '700' as const, color: '#5C4A2E', margin: '0 0 6px', letterSpacing: '0.04em' }
const voiceBody = { fontSize: '13px', color: '#4A6741', margin: 0, lineHeight: '1.75' }

const twoCol = { display: 'block', margin: '0 0 14px' }
const cell = { backgroundColor: 'hsl(40, 30%, 96%)', borderRadius: '10px', padding: '12px 14px', margin: '0 0 8px' }
const cellLbl = { fontSize: '10px', fontWeight: '600' as const, letterSpacing: '0.08em', color: 'hsl(20, 10%, 55%)', margin: '0 0 4px' }
const cellMain = { fontSize: '15px', fontWeight: '700' as const, color: 'hsl(160, 35%, 22%)', margin: '0 0 3px', lineHeight: '1.3' }
const cellSub = { fontSize: '12px', color: 'hsl(20, 10%, 45%)', margin: 0, lineHeight: '1.5' }

const nutriRow = { backgroundColor: '#FBF7F0', borderRadius: '10px', padding: '10px 12px', margin: '0 0 6px' }
const nutriLbl = { fontSize: '11px', fontWeight: '700' as const, color: '#5C4A2E', margin: '0 0 4px', letterSpacing: '0.04em' }
const nutriBody = { fontSize: '12.5px', color: 'hsl(20, 30%, 20%)', margin: 0, lineHeight: '1.65' }

const palRow = { backgroundColor: '#FBF7F0', borderRadius: '10px', padding: '10px 12px', margin: '0 0 6px', display: 'block' }
const palImgStyle = { display: 'inline-block', verticalAlign: 'middle', marginRight: '10px' }
const palText = { display: 'inline-block', verticalAlign: 'middle', margin: 0, fontSize: '12px', lineHeight: '1.5' }
const palLbl = { fontSize: '10px', fontWeight: '700' as const, color: '#5C4A2E', letterSpacing: '0.04em' }
const palName = { fontSize: '14px', fontWeight: '800' as const, color: 'hsl(20, 30%, 12%)' }
const palReason = { fontSize: '11.5px', color: 'hsl(20, 10%, 40%)' }

const tipBox = { backgroundColor: 'hsl(120, 25%, 95%)', borderLeft: '3px solid hsl(160, 35%, 35%)', borderRadius: '0 10px 10px 0', padding: '12px 14px', margin: '12px 0 14px' }
const tipLbl = { fontSize: '10px', fontWeight: '600' as const, letterSpacing: '0.08em', color: 'hsl(160, 35%, 25%)', margin: '0 0 6px' }
const tipTitle = { fontSize: '14px', fontWeight: '700' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 6px', lineHeight: '1.5' }
const tipBody = { fontSize: '13px', color: 'hsl(20, 10%, 40%)', margin: 0, lineHeight: '1.7' }

const dimRowFull = { borderBottom: '1px solid hsl(40, 20%, 90%)', padding: '10px 0', display: 'block' }
const dimRowHd = { margin: '0 0 6px', fontSize: '13px' }
const dimName = { color: 'hsl(20, 30%, 20%)', fontWeight: '600' as const }
const dimPct = { color: 'hsl(160, 35%, 25%)', fontWeight: '700' as const, float: 'right' as const }
const dimTrack = { height: '4px', backgroundColor: 'hsl(40, 20%, 90%)', borderRadius: '4px', margin: '0 0 8px', overflow: 'hidden' }
const dimFill = { height: '4px', backgroundColor: 'hsl(160, 35%, 35%)', borderRadius: '4px' }
const dimInsightTxt = { fontSize: '12.5px', color: 'hsl(20, 10%, 35%)', margin: '0 0 4px', lineHeight: '1.7' }
const dimTipTxt = { fontSize: '11.5px', color: 'hsl(20, 10%, 50%)', margin: 0, lineHeight: '1.65' }

const stateLine = { fontSize: '13px', color: 'hsl(20, 10%, 35%)', margin: '0 0 6px', lineHeight: '1.7' }
const stateSubLine = { fontSize: '11.5px', color: 'hsl(20, 10%, 55%)', margin: '8px 0 0', lineHeight: '1.6' }

const fullTipBox = { backgroundColor: '#FBF7F0', borderRadius: '10px', padding: '11px 13px', margin: '0 0 8px' }
const fullTipTitle = { fontSize: '13.5px', fontWeight: '700' as const, color: 'hsl(20, 30%, 12%)', margin: '0 0 5px', lineHeight: '1.5' }
const fullTipBody = { fontSize: '12.5px', color: 'hsl(20, 10%, 40%)', margin: 0, lineHeight: '1.7' }

const kaiaBox = { backgroundColor: 'hsl(120, 25%, 95%)', borderLeft: '3px solid hsl(160, 35%, 35%)', borderRadius: '0 10px 10px 0', padding: '14px 16px', margin: '0 0 18px' }
const kaiaLbl = { fontSize: '11px', fontWeight: '600' as const, letterSpacing: '0.07em', color: 'hsl(160, 35%, 25%)', margin: '0 0 6px' }
const kaiaBody = { fontSize: '13px', color: 'hsl(20, 30%, 20%)', margin: 0, lineHeight: '1.75' }
const disclaimer = { fontSize: '11px', color: 'hsl(20, 10%, 55%)', lineHeight: '1.7', margin: '0 0 16px' }
const hr = { borderColor: 'hsl(40, 20%, 90%)', margin: '20px 0' }
const footer = { fontSize: '12px', color: 'hsl(20, 10%, 55%)', margin: '24px 0 0', lineHeight: '1.6' }
