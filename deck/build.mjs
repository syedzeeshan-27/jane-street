import { createRequire } from 'node:module'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { bankNiftyWeights, jan17, jan17Path, leverageExample, liquidity, pattern, SEBI_ORDER_URL, segments } from './data.mjs'

const require = createRequire(import.meta.url)
const PptxGenJS = require('pptxgenjs')
const JSZip = require('jszip')

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, 'Jane_Street_Expiry_Day.pptx')

// Palette (matches the website)
const C = {
  bg: '0B1220',
  panel: '161F33',
  panel2: '1E2A44',
  text: 'E8ECF5',
  mute: '8B97B3',
  accent: 'F5B942',
  up: '22C55E',
  down: 'EF4444',
  blue: '60A5FA',
  line: '263049',
}
const FONT = 'Calibri'
const W = 13.33
const H = 7.5

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.title = 'Expiry Day: the Jane Street Bank Nifty case'
pptx.author = 'Case study'

const fmt = (n) => Number(n).toLocaleString('en-IN')

// ---------- helpers ----------
function newSlide() {
  const s = pptx.addSlide()
  s.background = { color: C.bg }
  return s
}
function eyebrow(s, text) {
  s.addText(text.toUpperCase(), { x: 0.6, y: 0.35, w: 12, h: 0.35, fontFace: FONT, fontSize: 12, bold: true, color: C.accent, charSpacing: 2, margin: 0, isTextBox: true })
}
function title(s, text, size = 36) {
  s.addText(text, { x: 0.6, y: 0.7, w: 12.1, h: 1.0, fontFace: FONT, fontSize: size, bold: true, color: C.text, margin: 0, valign: 'top', isTextBox: true })
}
function caption(s, text) {
  s.addText(text, { x: 0.6, y: 6.85, w: 12.1, h: 0.4, fontFace: FONT, fontSize: 10.5, color: C.mute, margin: 0, isTextBox: true })
}
function card(s, x, y, w, h, fill = C.panel) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 0.75 }, rectRadius: 0.12 })
}
function body(s, text, x, y, w, h, opts = {}) {
  s.addText(text, { x, y, w, h, fontFace: FONT, fontSize: 16, color: C.text, margin: 0.08, valign: 'top', isTextBox: true, ...opts })
}
function bullets(s, items, x, y, w, h, size = 16) {
  s.addText(
    items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8 } })),
    { x, y, w, h, fontFace: FONT, fontSize: size, color: C.text, valign: 'top', margin: 0.05, isTextBox: true },
  )
}
function stat(s, x, y, w, h, num, label, color = C.accent, numSize = 40) {
  card(s, x, y, w, h)
  s.addText(num, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: h * 0.55, fontFace: FONT, fontSize: numSize, bold: true, color, align: 'center', valign: 'middle', margin: 0, isTextBox: true })
  s.addText(label, { x: x + 0.2, y: y + h * 0.62, w: w - 0.4, h: h * 0.34, fontFace: FONT, fontSize: 12.5, color: C.mute, align: 'center', valign: 'top', margin: 0, isTextBox: true })
}
function circleNum(s, x, y, n, color = C.accent) {
  s.addShape(pptx.ShapeType.ellipse, { x, y, w: 0.5, h: 0.5, fill: { color }, line: { color, width: 0 } })
  s.addText(String(n), { x, y, w: 0.5, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: C.bg, align: 'center', valign: 'middle', margin: 0, isTextBox: true })
}
function sectionSlide(n, text, sub) {
  const s = newSlide()
  s.addText(n, { x: 0.8, y: 2.0, w: 3, h: 1.6, fontFace: FONT, fontSize: 96, bold: true, color: C.accent, margin: 0, isTextBox: true })
  s.addText(text, { x: 0.8, y: 3.6, w: 11.5, h: 1.1, fontFace: FONT, fontSize: 48, bold: true, color: C.text, margin: 0, isTextBox: true })
  if (sub) s.addText(sub, { x: 0.8, y: 4.7, w: 11, h: 0.8, fontFace: FONT, fontSize: 20, color: C.mute, margin: 0, isTextBox: true })
  return s
}
const darkChart = (extra = {}) => ({
  chartColors: [C.accent],
  catAxisLabelColor: C.mute,
  valAxisLabelColor: C.mute,
  catAxisLabelFontFace: FONT,
  valAxisLabelFontFace: FONT,
  catAxisLabelFontSize: 12,
  valAxisLabelFontSize: 11,
  valGridLine: { color: C.line, size: 0.5 },
  catGridLine: { style: 'none' },
  showLegend: false,
  dataLabelColor: C.text,
  dataLabelFontFace: FONT,
  dataLabelFontSize: 12,
  dataLabelFontBold: true,
  ...extra,
})

// ---------- 1 Title ----------
{
  const s = newSlide()
  s.addText('CASE STUDY  |  INDIAN MARKETS', { x: 0.8, y: 1.4, w: 11, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: C.accent, charSpacing: 3, margin: 0, isTextBox: true })
  s.addText('Expiry Day', { x: 0.8, y: 1.9, w: 11.5, h: 1.4, fontFace: FONT, fontSize: 72, bold: true, color: C.text, margin: 0, isTextBox: true })
  s.addText('How one firm allegedly moved Bank Nifty and made ₹4,843 crore', { x: 0.8, y: 3.3, w: 11.5, h: 1.2, fontFace: FONT, fontSize: 30, color: C.text, margin: 0, isTextBox: true })
  s.addText('Based on SEBI’s interim order of 3 July 2025. The order is interim and under appeal. Nothing here is a finding of guilt or financial advice.', { x: 0.8, y: 5.4, w: 11, h: 0.8, fontFace: FONT, fontSize: 14, color: C.mute, margin: 0, isTextBox: true })
  s.addText('Comes with an interactive website where you can run the trade yourself with pretend money.', { x: 0.8, y: 6.3, w: 11, h: 0.5, fontFace: FONT, fontSize: 14, color: C.accent, margin: 0, isTextBox: true })
}

// ---------- 2 What you will learn ----------
{
  const s = newSlide()
  eyebrow(s, 'In ten minutes')
  title(s, 'What you will be able to explain by the end')
  const steps = [
    ['What an index is', 'A basket of stocks rolled into one number.'],
    ['What calls and puts are', 'Bets on up and bets on down, with a small ticket.'],
    ['Why options are explosive', 'A 2% index move can be a 400% option move.'],
    ['Where the loophole is', 'Options trade 98x more than the stocks they depend on.'],
    ['The alleged trick, step by step', 'Push the small market, cash in on the big one.'],
    ['What SEBI did about it', 'The largest sum it has ever ordered impounded.'],
  ]
  steps.forEach(([h, d], i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 0.6 + col * 4.1
    const y = 2.0 + row * 2.3
    card(s, x, y, 3.85, 2.0)
    circleNum(s, x + 0.25, y + 0.25, i + 1)
    s.addText(h, { x: x + 0.9, y: y + 0.2, w: 2.8, h: 0.6, fontFace: FONT, fontSize: 17, bold: true, color: C.text, margin: 0, valign: 'middle', isTextBox: true })
    s.addText(d, { x: x + 0.25, y: y + 0.95, w: 3.35, h: 0.9, fontFace: FONT, fontSize: 14, color: C.mute, margin: 0, valign: 'top', isTextBox: true })
  })
}

// ---------- 3 Section ----------
sectionSlide('01', 'The setting', 'Why India, why expiry day, why options')

// ---------- 4 Biggest options market ----------
{
  const s = newSlide()
  eyebrow(s, 'The setting')
  title(s, 'India became the busiest options market on Earth')
  s.addChart(pptx.ChartType.doughnut, [{ name: 'Share of global index option contracts, 2023', labels: ['India (NSE)', 'Rest of the world'], values: [85, 15] }], {
    x: 0.6, y: 1.9, w: 5.6, h: 4.8,
    chartColors: [C.accent, C.panel2],
    holeSize: 60,
    showLegend: true, legendPos: 'b', legendColor: C.mute, legendFontFace: FONT, legendFontSize: 12,
    showPercent: false, showValue: false, showLabel: false,
    showTitle: false,
  })
  s.addText('~85%', { x: 2.05, y: 3.55, w: 2.7, h: 0.8, fontFace: FONT, fontSize: 36, bold: true, color: C.accent, align: 'center', margin: 0, isTextBox: true })
  bullets(s, [
    'An index option pays off based on where Nifty or Bank Nifty closes on expiry day.',
    'By 2023 NSE traded more of these contracts than every other exchange combined (about 85% of the world, per FIA data, approximate).',
    'Most of that volume came from over 13 crore retail accounts, and most retail traders lost money on expiry day bets.',
    'A market this deep and this predictable is a very attractive place for a large algorithmic trader.',
  ], 6.6, 2.0, 6.2, 4.6, 16)
  caption(s, 'Share figure is approximate, from Futures Industry Association 2023 volume data. Retail loss statistics from SEBI studies.')
}

// ---------- 5 What is Bank Nifty ----------
{
  const s = newSlide()
  eyebrow(s, 'The setting')
  title(s, 'Bank Nifty is a basket of 12 bank stocks')
  s.addChart(pptx.ChartType.doughnut, [{ name: 'Weight', labels: bankNiftyWeights.labels, values: bankNiftyWeights.values }], {
    x: 0.6, y: 1.9, w: 6.0, h: 4.9,
    chartColors: [C.accent, C.blue, C.up, 'A78BFA', 'F472B6', C.panel2],
    holeSize: 55,
    showLegend: true, legendPos: 'r', legendColor: C.text, legendFontFace: FONT, legendFontSize: 12,
    showPercent: true, dataLabelColor: C.text, dataLabelFontSize: 11, dataLabelFontBold: true,
  })
  card(s, 7.0, 2.0, 5.7, 4.5)
  body(s, [
    { text: 'The index is a weighted average.', options: { bold: true, breakLine: true, fontSize: 18 } },
    { text: 'HDFC Bank and ICICI Bank alone are about half the index. If those two move 1%, the index moves close to half a percent.', options: { breakLine: true, color: C.mute } },
    { text: ' ', options: { breakLine: true } },
    { text: 'So here is the key idea.', options: { bold: true, breakLine: true, fontSize: 18 } },
    { text: 'Anyone who can move the big bank stocks can move Bank Nifty. And Bank Nifty is what every option contract settles on.', options: { color: C.mute } },
  ], 7.2, 2.2, 5.3, 4.1)
  caption(s, 'Weights are rounded early 2024 values and are illustrative. The index is rebalanced periodically.')
}

// ---------- 6 Call ----------
function payoffSlide(kind) {
  const s = newSlide()
  eyebrow(s, 'Options in 60 seconds')
  const isCall = kind === 'call'
  title(s, isCall ? 'A call is a bet that the index goes UP' : 'A put is a bet that the index goes DOWN')
  const labels = []
  const values = []
  for (let i = 45000; i <= 55000; i += 500) {
    labels.push(i % 2500 === 0 ? fmt(i) : '')
    const intrinsic = isCall ? Math.max(0, i - 50000) : Math.max(0, 50000 - i)
    values.push(intrinsic - 200)
  }
  s.addChart(pptx.ChartType.line, [{ name: 'Profit at expiry (points)', labels, values }], {
    x: 0.6, y: 1.9, w: 7.4, h: 4.8,
    ...darkChart({ chartColors: [isCall ? C.up : C.down] }),
    lineSize: 4, lineDataSymbol: 'none',
    showValAxisTitle: true, valAxisTitle: 'Your profit at expiry (index points)', valAxisTitleColor: C.mute, valAxisTitleFontSize: 11,
    showCatAxisTitle: true, catAxisTitle: 'Where Bank Nifty closes', catAxisTitleColor: C.mute, catAxisTitleFontSize: 11,
    valAxisMinVal: -1000, valAxisMaxVal: 5000,
  })
  card(s, 8.4, 2.0, 4.3, 4.6)
  body(s, [
    { text: 'Strike: 50,000', options: { bold: true, breakLine: true, fontSize: 18 } },
    { text: 'Premium paid: 200 points', options: { bold: true, breakLine: true, fontSize: 18 } },
    { text: ' ', options: { breakLine: true } },
    { text: isCall
      ? 'At expiry the call pays the amount the index finishes above 50,000. Below 50,000 it pays nothing.'
      : 'At expiry the put pays the amount the index finishes below 50,000. Above 50,000 it pays nothing.', options: { breakLine: true, color: C.mute } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Buyer: loses at most the 200 premium, can win a lot.', options: { breakLine: true, color: C.up } },
    { text: 'Seller: wins at most the 200 premium, can lose a lot.', options: { color: C.down } },
  ], 8.6, 2.2, 3.9, 4.3, { fontSize: 15 })
  caption(s, 'Simplified. Real premiums depend on time to expiry and volatility.')
}
payoffSlide('call')
payoffSlide('put')

// ---------- 8 Leverage ----------
{
  const s = newSlide()
  eyebrow(s, 'Options in 60 seconds')
  title(s, 'Leverage: ₹1 of option controls ₹100 of stock')
  s.addChart(pptx.ChartType.bar, [{ name: 'Money you must put up for the same exposure', labels: ['Buy the stock', 'Buy a future', 'Buy an option'], values: [leverageExample.cash, leverageExample.futuresMargin, leverageExample.optionPremium] }], {
    x: 0.6, y: 1.9, w: 7.2, h: 4.7,
    ...darkChart({ chartColors: [C.blue, C.blue, C.accent] }),
    barDir: 'col', barGapWidthPct: 60,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '"₹"0',
    valAxisHidden: true, valGridLine: { style: 'none' },
    catAxisLabelFontSize: 14,
  })
  card(s, 8.2, 2.0, 4.5, 4.6)
  body(s, [
    { text: 'SEBI’s own example (para 10)', options: { bold: true, breakLine: true, fontSize: 17 } },
    { text: 'A stock costs ₹100. A future on it needs about ₹20 of margin. An at the money call with one day left costs about ₹1.', options: { breakLine: true, color: C.mute } },
    { text: ' ', options: { breakLine: true } },
    { text: '100x leverage', options: { bold: true, fontSize: 30, color: C.accent, breakLine: true } },
    { text: 'A small move in the index is a huge move in the option. That is why 16 lakh people trade the option and only 4,675 trade the stocks.', options: { color: C.mute } },
  ], 8.4, 2.2, 4.1, 4.3, { fontSize: 15 })
}

// ---------- 9 Pond vs lake ----------
{
  const s = newSlide()
  eyebrow(s, 'The loophole')
  title(s, 'A small pond feeding a giant lake')
  s.addChart(pptx.ChartType.bar, [{ name: 'Traded on 17 Jan 2024, ₹ crore (cash equivalent)', labels: ['Bank stocks', 'Bank stock futures', 'Bank Nifty futures', 'Bank Nifty OPTIONS'], values: [liquidity.cash, liquidity.stockFutures, liquidity.indexFutures, liquidity.options] }], {
    x: 0.6, y: 1.9, w: 8.0, h: 4.7,
    ...darkChart({ chartColors: [C.up, C.blue, C.blue, C.accent] }),
    barDir: 'bar', barGapWidthPct: 40,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '#,##0',
    valAxisHidden: true, valGridLine: { style: 'none' },
    catAxisLabelFontSize: 13,
  })
  stat(s, 9.0, 2.0, 3.7, 2.1, `${liquidity.optionsVsAll}x`, 'options traded vs stocks and futures combined', C.accent, 44)
  stat(s, 9.0, 4.4, 3.7, 2.1, `${liquidity.optionsVsCash}x`, 'options traded vs the bank stocks alone', C.accent, 44)
  caption(s, 'SEBI interim order, Table 2. Option volumes are converted to cash equivalent so the bars compare like for like.')
}

// ---------- 10 Who trades where ----------
{
  const s = newSlide()
  eyebrow(s, 'The loophole')
  title(s, 'Who was trading that day')
  s.addChart(pptx.ChartType.bar, [{ name: 'Unique entities trading on 17 Jan 2024', labels: ['Top 3 bank stocks', 'Bank Nifty futures', 'Bank Nifty options'], values: [liquidity.entitiesCash, liquidity.entitiesFutures, liquidity.entitiesOptions] }], {
    x: 0.6, y: 1.9, w: 7.6, h: 4.7,
    ...darkChart({ chartColors: [C.up, C.blue, C.accent] }),
    barDir: 'col', barGapWidthPct: 50,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '#,##0',
    valAxisHidden: true, valGridLine: { style: 'none' },
    catAxisLabelFontSize: 13,
  })
  card(s, 8.6, 2.0, 4.1, 4.6)
  body(s, [
    { text: 'Sixteen lakh people traded the options.', options: { bold: true, fontSize: 18, breakLine: true } },
    { text: 'Fewer than five thousand traded the stocks the options depend on.', options: { bold: true, fontSize: 18, breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Option traders watch the index level and react to it. Almost none of them look at, or trade in, the pond that sets that level.', options: { color: C.mute } },
  ], 8.8, 2.2, 3.7, 4.3, { fontSize: 15 })
  caption(s, 'SEBI interim order, Table 3.')
}

// ---------- 11 Section ----------
sectionSlide('02', 'The strategy', 'What SEBI says happened on 17 January 2024, and on 17 other days')

// ---------- 12 Who is Jane Street ----------
{
  const s = newSlide()
  eyebrow(s, 'The strategy')
  title(s, 'Who is Jane Street')
  card(s, 0.6, 1.9, 5.6, 4.7)
  body(s, [
    { text: 'A global trading giant', options: { bold: true, fontSize: 20, breakLine: true } },
    { text: 'A New York firm that trades its own money with algorithms, in markets all over the world. It is one of the biggest options traders anywhere.', options: { color: C.mute, breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Four entities in India', options: { bold: true, fontSize: 20, breakLine: true } },
    { text: 'SEBI treated them as one group. The Indian company mattered: foreign investors are not allowed to buy and sell the same stock within a day, but an Indian company is.', options: { color: C.mute } },
  ], 0.8, 2.1, 5.2, 4.3, { fontSize: 15 })
  const ents = [
    ['JSI Investments Pvt Ltd', 'Indian company'],
    ['JSI2 Investments Pvt Ltd', 'Indian company'],
    ['Jane Street Singapore Pte Ltd', 'Foreign investor'],
    ['Jane Street Asia Trading Ltd', 'Foreign investor'],
  ]
  ents.forEach(([n, t], i) => {
    const y = 1.9 + i * 1.2
    card(s, 6.6, y, 6.1, 1.05, C.panel2)
    s.addText(n, { x: 6.85, y: y + 0.12, w: 5.6, h: 0.45, fontFace: FONT, fontSize: 16, bold: true, color: C.text, margin: 0, isTextBox: true })
    s.addText(t, { x: 6.85, y: y + 0.55, w: 5.6, h: 0.4, fontFace: FONT, fontSize: 12.5, color: C.accent, margin: 0, isTextBox: true })
  })
}

// ---------- 13 The idea in one picture ----------
{
  const s = newSlide()
  eyebrow(s, 'The strategy')
  title(s, 'The idea in one picture')
  // pond
  s.addShape(pptx.ShapeType.ellipse, { x: 1.2, y: 3.3, w: 2.2, h: 1.5, fill: { color: C.up, transparency: 30 }, line: { color: C.up, width: 1.5 } })
  s.addText('Bank stocks\n(the pond)', { x: 1.2, y: 3.3, w: 2.2, h: 1.5, fontFace: FONT, fontSize: 14, bold: true, color: C.text, align: 'center', valign: 'middle', margin: 0, isTextBox: true })
  // arrow
  s.addShape(pptx.ShapeType.rightArrow, { x: 3.7, y: 3.75, w: 2.0, h: 0.6, fill: { color: C.accent }, line: { color: C.accent, width: 0 } })
  s.addText('sets the index level', { x: 3.5, y: 4.45, w: 2.4, h: 0.4, fontFace: FONT, fontSize: 11, color: C.mute, align: 'center', margin: 0, isTextBox: true })
  // lake
  s.addShape(pptx.ShapeType.ellipse, { x: 6.0, y: 2.0, w: 6.6, h: 4.2, fill: { color: C.accent, transparency: 75 }, line: { color: C.accent, width: 1.5 } })
  s.addText('Bank Nifty options\n(the lake)\n98x bigger', { x: 6.0, y: 2.0, w: 6.6, h: 4.2, fontFace: FONT, fontSize: 22, bold: true, color: C.text, align: 'center', valign: 'middle', margin: 0, isTextBox: true })
  circleNum(s, 0.6, 5.5, 1)
  s.addText('Buy hard in the pond. The water level (the index) rises.', { x: 1.25, y: 5.5, w: 5.2, h: 0.5, fontFace: FONT, fontSize: 14, color: C.text, valign: 'middle', margin: 0, isTextBox: true })
  circleNum(s, 0.6, 6.1, 2)
  s.addText('Meanwhile, place a much bigger bet in the lake that the level will fall.', { x: 1.25, y: 6.1, w: 5.2, h: 0.5, fontFace: FONT, fontSize: 14, color: C.text, valign: 'middle', margin: 0, isTextBox: true })
  circleNum(s, 6.8, 6.4, 3)
  s.addText('Sell everything in the pond. The level falls. The lake bet pays.', { x: 7.45, y: 6.4, w: 5.3, h: 0.5, fontFace: FONT, fontSize: 14, color: C.text, valign: 'middle', margin: 0, isTextBox: true })
}

// ---------- 14 Morning ----------
function dayChart(s, highlight) {
  s.addChart(pptx.ChartType.line, [{ name: 'Bank Nifty', labels: jan17Path.labels, values: jan17Path.values }], {
    x: 0.6, y: 1.9, w: 7.8, h: 4.8,
    ...darkChart({ chartColors: [C.text] }),
    lineSize: 3.5, lineDataSymbol: 'circle', lineDataSymbolSize: 6,
    valAxisMinVal: 45500, valAxisMaxVal: 47500, valAxisMajorUnit: 500, valAxisLabelFormatCode: '#,##0',
    catAxisLabelFontSize: 10,
    showTitle: true, title: highlight === 'am' ? 'Morning: index propped up in a falling market' : 'Afternoon: index pushed down into the close', titleColor: C.mute, titleFontSize: 12, titleFontFace: FONT,
  })
  // shaded highlight box over chart area (approximate)
  const x = highlight === 'am' ? 1.35 : 4.35
  const w = highlight === 'am' ? 3.0 : 3.9
  s.addShape(pptx.ShapeType.rect, { x, y: 2.3, w, h: 3.8, fill: { color: highlight === 'am' ? C.up : C.down, transparency: 85 }, line: { color: highlight === 'am' ? C.up : C.down, width: 0 } })
  s.addText(highlight === 'am' ? 'Patch I  09:15 to 11:47' : 'Patch II  11:49 to 15:30', { x, y: 2.35, w, h: 0.35, fontFace: FONT, fontSize: 11, bold: true, color: highlight === 'am' ? C.up : C.down, align: 'center', margin: 0, isTextBox: true })
}
{
  const s = newSlide()
  eyebrow(s, '17 January 2024, a Bank Nifty expiry day')
  title(s, 'Morning: buy stocks hard, become the biggest buyer')
  dayChart(s, 'am')
  stat(s, 8.8, 1.9, 3.9, 1.5, `₹${fmt(jan17.buyCrore)} cr`, 'of bank stocks and futures bought between 09:15 and 11:47', C.up, 30)
  card(s, 8.8, 3.6, 3.9, 3.0)
  body(s, [
    { text: 'The day opened 1,550 points down after HDFC Bank results.', options: { breakLine: true, color: C.mute } },
    { text: ' ', options: { breakLine: true } },
    { text: 'SEBI says Jane Street was by far the single largest buyer, buying aggressively at prices that pushed the stocks, and so the index, upward.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Other traders saw the index holding up.', options: { bold: true } },
  ], 9.0, 3.75, 3.5, 2.75, { fontSize: 13.5 })
  caption(s, 'Index path is stylised from SEBI’s reported open, high, low and close (Table 5). Not minute by minute data. Buying figure from para 15.2.')
}

// ---------- 15 Hidden bet ----------
{
  const s = newSlide()
  eyebrow(s, '17 January 2024, same morning')
  title(s, 'The hidden bet: 7 times bigger, and the other way')
  s.addChart(pptx.ChartType.bar, [{ name: '₹ crore', labels: ['Stocks and futures BOUGHT (bet on up)', 'Options positioned for a FALL'], values: [jan17.buyCrore, jan17.optionsCrore] }], {
    x: 0.6, y: 1.9, w: 7.6, h: 4.6,
    ...darkChart({ chartColors: [C.up, C.down] }),
    barDir: 'bar', barGapWidthPct: 45,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '"₹"#,##0" cr"',
    valAxisHidden: true, valGridLine: { style: 'none' },
    catAxisLabelFontSize: 13,
  })
  card(s, 8.6, 2.0, 4.1, 4.5)
  body(s, [
    { text: 'Because the index had just been pushed up:', options: { bold: true, breakLine: true } },
    { text: 'puts (bets on a fall) were cheap', options: { bullet: true, breakLine: true, color: C.mute } },
    { text: 'calls (bets on a rise) were expensive', options: { bullet: true, breakLine: true, color: C.mute } },
    { text: ' ', options: { breakLine: true } },
    { text: 'SEBI says the group bought the cheap puts and sold the expensive calls, in size.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: `In the first 8 minutes alone: ₹${fmt(jan17.first8min.boughtCrore)} cr of stocks against ₹${fmt(jan17.first8min.optionsCrore)} cr of options.`, options: { color: C.accent, bold: true } },
  ], 8.8, 2.2, 3.7, 4.2, { fontSize: 14 })
  caption(s, 'SEBI interim order, paras 15.2, 15.13 and 15.27.')
}

// ---------- 16 Afternoon ----------
{
  const s = newSlide()
  eyebrow(s, '17 January 2024, afternoon')
  title(s, 'Afternoon: sell everything, push the index down')
  dayChart(s, 'pm')
  stat(s, 8.8, 1.9, 3.9, 1.5, `₹${fmt(jan17.sellCrore)} cr`, 'of the same stocks and futures sold between 11:49 and 15:30', C.down, 30)
  card(s, 8.8, 3.6, 3.9, 3.0)
  body(s, [
    { text: 'Everything bought in the morning was dumped, aggressively, at prices that pushed the stocks down.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: `The index closed at ${fmt(jan17.close)}, well below the morning high of ${fmt(jan17.high)}.`, options: { breakLine: true, color: C.mute } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Options settle on the closing level.', options: { bold: true } },
  ], 9.0, 3.75, 3.5, 2.75, { fontSize: 13.5 })
  caption(s, 'Selling figure from para 15.49.3. Index levels from Table 5.')
}

// ---------- 17 Scoreboard ----------
{
  const s = newSlide()
  eyebrow(s, '17 January 2024, at the close')
  title(s, 'The scoreboard for one day')
  s.addChart(pptx.ChartType.bar, [
    { name: 'Stocks and futures', labels: ['17 Jan 2024'], values: [-jan17.underlyingLossCrore] },
    { name: 'Bank Nifty options', labels: ['17 Jan 2024'], values: [jan17.optionsProfitCrore] },
  ], {
    x: 0.6, y: 1.9, w: 6.4, h: 4.7,
    ...darkChart({ chartColors: [C.down, C.up], showLegend: true, legendPos: 'b', legendColor: C.mute, legendFontFace: FONT, legendFontSize: 12 }),
    barDir: 'col', barGapWidthPct: 80,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '"₹"#,##0.0" cr"',
    valAxisLabelFormatCode: '#,##0', valAxisMinVal: -100, valAxisMaxVal: 800,
    catAxisHidden: true,
  })
  stat(s, 7.4, 1.9, 2.55, 2.2, `₹${jan17.underlyingLossCrore} cr`, 'LOST on stocks and futures', C.down, 28)
  stat(s, 10.15, 1.9, 2.55, 2.2, `₹${jan17.optionsProfitCrore} cr`, 'MADE on options', C.up, 28)
  card(s, 7.4, 4.3, 5.3, 2.3)
  body(s, [
    { text: 'The stock trading lost money. It was supposed to.', options: { bold: true, breakLine: true, fontSize: 16 } },
    { text: 'Buying ₹4,370 crore and selling it all the same day, aggressively, will almost always lose. SEBI says the loss was the cost of moving the index, and the options paid for it twelve times over.', options: { color: C.mute } },
  ], 7.6, 4.45, 4.9, 2.0, { fontSize: 13.5 })
  caption(s, 'SEBI interim order, paras 15.43 and 15.49.4.')
}

// ---------- 18 Why manipulation ----------
{
  const s = newSlide()
  eyebrow(s, 'The strategy')
  title(s, 'Why SEBI called it manipulation')
  const items = [
    ['Scale', 'The buying and selling were huge compared with everyone else in the stock market that day. Big enough to move prices, and SEBI’s trade by trade analysis says it did.'],
    ['Reversal with no reason', 'Buy in the morning, sell it all by the close, lose money doing it. On its own that trade makes no sense. It only makes sense next to the options.'],
    ['Timing', 'The option bets were placed exactly while the index was being propped up, and cashed in exactly while it was being pushed down. Then volumes dropped back to normal the next day.'],
  ]
  items.forEach(([h, d], i) => {
    const x = 0.6 + i * 4.1
    card(s, x, 2.0, 3.85, 4.5)
    circleNum(s, x + 0.3, 2.3, i + 1)
    s.addText(h, { x: x + 0.3, y: 2.95, w: 3.3, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: C.text, margin: 0, isTextBox: true })
    s.addText(d, { x: x + 0.3, y: 3.5, w: 3.3, h: 2.8, fontFace: FONT, fontSize: 14, color: C.mute, margin: 0, valign: 'top', isTextBox: true })
  })
  caption(s, 'SEBI also noted the same day buying and selling was done through the Indian entity, since foreign investors cannot do intraday trades (para 15.50.2).')
}

// ---------- 19 Not one day ----------
{
  const s = newSlide()
  eyebrow(s, 'The pattern')
  title(s, 'Not one day. The same footprint on 15 days.')
  s.addChart(pptx.ChartType.bar, [
    { name: 'Options profit', labels: ['15 expiry days'], values: [pattern.intradayOptionsProfitCrore] },
    { name: 'Stocks and futures loss', labels: ['15 expiry days'], values: [-pattern.intradayUnderlyingLossCrore] },
  ], {
    x: 0.6, y: 1.9, w: 6.6, h: 4.7,
    ...darkChart({ chartColors: [C.up, C.down], showLegend: true, legendPos: 'b', legendColor: C.mute, legendFontFace: FONT, legendFontSize: 12 }),
    barDir: 'col', barGapWidthPct: 80,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '"₹"#,##0" cr"',
    valAxisLabelFormatCode: '#,##0', valAxisMinVal: -500, valAxisMaxVal: 4500,
    catAxisHidden: true,
  })
  stat(s, 7.6, 1.9, 5.1, 2.2, `₹${fmt(pattern.intradayOptionsProfitCrore)} cr`, 'options profit across the 15 intraday pattern days', C.up, 40)
  card(s, 7.6, 4.3, 5.1, 2.3)
  body(s, [
    { text: 'Same shape every time', options: { bold: true, breakLine: true, fontSize: 16 } },
    { text: 'Heavy buying in the morning, heavy selling into the close, and a far larger bet on a fall in between. Every one of the 15 days was a Bank Nifty weekly expiry.', options: { color: C.mute } },
  ], 7.8, 4.45, 4.7, 2.0, { fontSize: 13.5 })
  caption(s, 'SEBI interim order, paras 15.55 and 15.56.')
}

// ---------- 20 Marking the close ----------
{
  const s = newSlide()
  eyebrow(s, 'Pattern two')
  title(s, 'Marking the close: the same trick, squeezed into the last hour')
  const segs = [
    { x: 0.6, w: 7.2, label: '09:15 to 14:30', text: 'Quiet. Low volume, no direction.', color: C.panel2 },
    { x: 7.9, w: 3.6, label: '14:30 to 15:30', text: 'Big option positions in place. Aggressive selling of bank stocks and futures.', color: C.down },
    { x: 11.6, w: 1.1, label: '15:30', text: 'Close', color: C.accent },
  ]
  segs.forEach((g) => {
    s.addShape(pptx.ShapeType.rect, { x: g.x, y: 2.2, w: g.w, h: 0.9, fill: { color: g.color, transparency: g.color === C.panel2 ? 0 : 20 }, line: { color: C.bg, width: 1 } })
    s.addText(g.label, { x: g.x, y: 2.2, w: g.w, h: 0.9, fontFace: FONT, fontSize: 13, bold: true, color: C.text, align: 'center', valign: 'middle', margin: 0, isTextBox: true })
    s.addText(g.text, { x: g.x, y: 3.2, w: g.w, h: 1.0, fontFace: FONT, fontSize: 12.5, color: C.mute, align: 'center', valign: 'top', margin: 0.05, isTextBox: true })
  })
  card(s, 0.6, 4.5, 12.1, 2.1)
  body(s, [
    { text: 'Why the last hour matters', options: { bold: true, breakLine: true, fontSize: 17 } },
    { text: 'Bank Nifty options settle on the closing level. Push the index down in the final minutes and every put you hold pays more, every call you sold pays less. SEBI says this happened on 3 expiry days, for example 10 July 2024.', options: { color: C.mute } },
  ], 0.8, 4.65, 11.7, 1.8, { fontSize: 14.5 })
  caption(s, 'SEBI interim order, section 16, Table 26.')
}

// ---------- 21 Marking the close numbers ----------
{
  const s = newSlide()
  eyebrow(s, 'Pattern two, 10 July 2024')
  title(s, 'One hour of selling against a ₹44,000 crore options book')
  s.addChart(pptx.ChartType.bar, [{ name: '₹ crore', labels: ['Bank stocks and futures SOLD, 14:30 to 15:30', 'Options positions benefiting from a lower close'], values: [pattern.closeExample.soldCrore, Math.round(pattern.closeExample.optionsCrore)] }], {
    x: 0.6, y: 1.9, w: 7.6, h: 4.6,
    ...darkChart({ chartColors: [C.down, C.accent] }),
    barDir: 'bar', barGapWidthPct: 45,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '"₹"#,##0" cr"',
    valAxisHidden: true, valGridLine: { style: 'none' },
    catAxisLabelFontSize: 12.5,
  })
  stat(s, 8.6, 1.9, 4.1, 2.2, `₹${fmt(pattern.closeOptionsProfitCrore)} cr`, 'options profit across the 3 closing hour days', C.up, 40)
  card(s, 8.6, 4.3, 4.1, 2.3)
  body(s, [
    { text: 'The pattern kept going', options: { bold: true, breakLine: true, fontSize: 16 } },
    { text: 'NSE sent a caution letter in February 2025. SEBI says a similar closing hour pattern was still visible in Nifty on 15 May 2025.', options: { color: C.mute } },
  ], 8.8, 4.45, 3.7, 2.0, { fontSize: 13.5 })
  caption(s, 'SEBI interim order, section 16 and para 21.')
}

// ---------- 22 Full picture ----------
{
  const s = newSlide()
  eyebrow(s, 'The full picture, January 2023 to March 2025')
  title(s, 'Where the money came from, and where it went')
  s.addChart(pptx.ChartType.bar, [{ name: 'Profit or loss, ₹ crore', labels: segments.labels, values: segments.values }], {
    x: 0.6, y: 1.9, w: 8.0, h: 4.7,
    ...darkChart({ chartColors: [C.up, C.up, C.down, C.down, C.down] }),
    barDir: 'col', barGapWidthPct: 50,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '#,##0',
    valAxisLabelFormatCode: '#,##0', valAxisMinVal: -10000, valAxisMaxVal: 50000,
    catAxisLabelFontSize: 12,
  })
  stat(s, 9.0, 1.9, 3.7, 2.2, `₹${fmt(segments.total)} cr`, 'total profit over the period, all segments', C.accent, 32)
  card(s, 9.0, 4.3, 3.7, 2.3)
  body(s, [
    { text: 'Losses everywhere except options', options: { bold: true, breakLine: true, fontSize: 15 } },
    { text: 'SEBI was careful: the profits are a clue, not the evidence. The evidence is the trading pattern on the 18 days in the order.', options: { color: C.mute } },
  ], 9.2, 4.45, 3.3, 2.0, { fontSize: 13 })
  caption(s, 'SEBI interim order, Table 4. Bank Nifty options alone contributed ₹17,319 crore of the index option profit.')
}

// ---------- 23 Section ----------
sectionSlide('03', 'The crackdown', 'How it was spotted and what SEBI ordered')

// ---------- 24 How it was spotted ----------
{
  const s = newSlide()
  eyebrow(s, 'The crackdown')
  title(s, 'How the regulator caught on')
  const steps = [
    ['April 2024', 'Jane Street sues two former employees in New York over a secret India options strategy. Indian media notice.'],
    ['Mid 2024', 'SEBI asks NSE to examine the group’s trading. Minute by minute stock, futures and options data across two years of expiry days.'],
    ['Feb 2025', 'NSE sends a caution letter telling the group to stop the pattern. SEBI says it continued in May 2025.'],
    ['3 July 2025', 'SEBI passes a 105 page interim order.'],
  ]
  steps.forEach(([w, t], i) => {
    const x = 0.6 + i * 3.1
    card(s, x, 2.0, 2.9, 4.4)
    circleNum(s, x + 0.25, 2.25, i + 1)
    s.addText(w, { x: x + 0.25, y: 2.9, w: 2.4, h: 0.45, fontFace: FONT, fontSize: 17, bold: true, color: C.accent, margin: 0, isTextBox: true })
    s.addText(t, { x: x + 0.25, y: 3.4, w: 2.4, h: 2.8, fontFace: FONT, fontSize: 13.5, color: C.text, margin: 0, valign: 'top', isTextBox: true })
  })
}

// ---------- 25 The order ----------
{
  const s = newSlide()
  eyebrow(s, 'The crackdown')
  title(s, 'The interim order of 3 July 2025')
  stat(s, 0.6, 1.9, 6.0, 2.3, `₹${fmt(pattern.impoundedCrore)} cr`, 'of alleged unlawful gains ordered impounded, the largest sum SEBI has ever ordered', C.accent, 48)
  stat(s, 6.8, 1.9, 2.85, 2.3, '18', 'expiry days covered by the order', C.text, 48)
  stat(s, 9.85, 1.9, 2.85, 2.3, '4', 'entities barred from trading', C.text, 48)
  card(s, 0.6, 4.4, 12.1, 2.0)
  bullets(s, [
    'Prima facie finding: a deliberate scheme to move index levels and profit from it, violating SEBI’s fraud and unfair trade practice rules.',
    'Banks told not to let money out of the group’s accounts without SEBI’s permission until the amount was deposited.',
    'Interim means before a full hearing. The group could reply, and did.',
  ], 0.8, 4.6, 11.7, 1.7, 16)
}

// ---------- 26 Since then ----------
{
  const s = newSlide()
  eyebrow(s, 'Where it stands')
  title(s, 'What happened next')
  const items = [
    ['14 July 2025', 'Jane Street deposits the full ₹4,843.57 crore in escrow, while denying wrongdoing.'],
    ['21 July 2025', 'SEBI allows the four entities back into the market.'],
    ['Since', 'The group is contesting the findings on appeal. SEBI and the exchanges added surveillance staff and now watch expiry day trading far more closely.'],
    ['For everyone else', 'Expiry day moves in the index are not always what they seem. Sixteen lakh option traders were reacting to a level that, SEBI says, one firm was setting.'],
  ]
  items.forEach(([w, t], i) => {
    const y = 1.9 + i * 1.2
    s.addShape(pptx.ShapeType.ellipse, { x: 0.7, y: y + 0.3, w: 0.35, h: 0.35, fill: { color: C.accent }, line: { color: C.accent, width: 0 } })
    s.addText(w, { x: 1.3, y, w: 2.6, h: 0.95, fontFace: FONT, fontSize: 16, bold: true, color: C.accent, valign: 'middle', margin: 0, isTextBox: true })
    s.addText(t, { x: 4.0, y, w: 8.7, h: 0.95, fontFace: FONT, fontSize: 15, color: C.text, valign: 'middle', margin: 0, isTextBox: true })
  })
}

// ---------- 27 Two sides ----------
{
  const s = newSlide()
  eyebrow(s, 'Where it stands')
  title(s, 'Two sides of the argument')
  card(s, 0.6, 1.9, 5.95, 4.7, C.panel)
  s.addText('Jane Street says', { x: 0.85, y: 2.05, w: 5.4, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: C.blue, margin: 0, isTextBox: true })
  bullets(s, [
    'The trades were ordinary index arbitrage: when the index fell below where futures and options implied it should be, it bought the stocks. That is normal market making.',
    'Nothing it did was hidden, and it followed the exchange rules.',
    'It denies manipulation and is appealing.',
  ], 0.85, 2.65, 5.45, 3.8, 14.5)
  card(s, 6.75, 1.9, 5.95, 4.7, C.panel)
  s.addText('SEBI says', { x: 7.0, y: 2.05, w: 5.4, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: C.accent, margin: 0, isTextBox: true })
  bullets(s, [
    'Arbitrage does not require being the biggest buyer in the market and then the biggest seller, at a loss, the same day.',
    'The size, the reversal and the timing against enormous option positions only make sense as index manipulation.',
    'It happened on 18 expiry days and continued after a warning.',
  ], 7.0, 2.65, 5.45, 3.8, 14.5)
  caption(s, 'The appeal will decide. This deck takes no position on the outcome.')
}

// ---------- 28 Try it yourself ----------
{
  const s = newSlide()
  eyebrow(s, 'Try it yourself')
  title(s, 'Play the strategy with pretend money')
  card(s, 0.6, 1.9, 7.4, 4.7)
  body(s, [
    { text: 'The companion website lets you do the whole trade at a tiny scale:', options: { breakLine: true, bold: true, fontSize: 17 } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Buy ₹4.4 lakh of bank stocks and watch the index jump', options: { bullet: true, breakLine: true } },
    { text: 'Buy cheap puts and sell expensive calls', options: { bullet: true, breakLine: true } },
    { text: 'Dump the stocks and watch the index fall', options: { bullet: true, breakLine: true } },
    { text: 'See the stocks lose and the options win at 15:30', options: { bullet: true, breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Then a free play sandbox where you compete against an honest buy and hold trader.', options: { color: C.mute } },
  ], 0.8, 2.1, 7.0, 4.3, { fontSize: 15 })
  card(s, 8.3, 1.9, 4.4, 4.7, C.panel2)
  s.addText('Sources', { x: 8.55, y: 2.05, w: 4.0, h: 0.5, fontFace: FONT, fontSize: 18, bold: true, color: C.text, margin: 0, isTextBox: true })
  s.addText([
    { text: 'SEBI interim order, 3 July 2025, WTM/AN/MRD/MRD-SEC-3/31516/2025-26', options: { breakLine: true } },
    { text: SEBI_ORDER_URL, options: { hyperlink: { url: SEBI_ORDER_URL }, color: C.blue, breakLine: true, fontSize: 10.5 } },
    { text: ' ', options: { breakLine: true } },
    { text: 'Public reporting by Business Standard, Bloomberg and Reuters on the escrow deposit and appeal.', options: { breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: 'All simulation numbers are illustrative. All real figures are SEBI’s allegations in an interim order that is under appeal.', options: { color: C.mute } },
  ], { x: 8.55, y: 2.6, w: 4.0, h: 3.9, fontFace: FONT, fontSize: 12.5, color: C.text, valign: 'top', margin: 0, isTextBox: true })
  s.addText('Thank you', { x: 0.6, y: 6.75, w: 6, h: 0.5, fontFace: FONT, fontSize: 20, bold: true, color: C.accent, margin: 0, isTextBox: true })
}

// ---------- write and check ----------
await pptx.writeFile({ fileName: OUT })
const zip = await JSZip.loadAsync(readFileSync(OUT))
const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
let dashes = 0
for (const f of slideFiles) {
  const xml = await zip.file(f).async('string')
  const m = xml.match(/[–—]/g)
  if (m) {
    dashes += m.length
    console.error(`en/em dash found in ${f}`)
  }
}
console.log(`Wrote ${OUT}`)
console.log(`Slides: ${slideFiles.length}`)
if (slideFiles.length !== 28) throw new Error(`expected 28 slides, got ${slideFiles.length}`)
if (dashes) throw new Error(`${dashes} en/em dashes found`)
console.log('No en or em dashes.')
const dl = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'Jane_Street_Expiry_Day.pptx')
if (existsSync(path.dirname(dl))) {
  copyFileSync(OUT, dl)
  console.log(`Copied to ${dl}`)
}
