import { motion } from 'framer-motion'
import { fullPeriod, pattern, SEBI_ORDER_URL, timeline } from '../data/facts'
import { LeverageWidget } from './LeverageWidget'
import { Callout, Section } from './ui'

export function Comparison() {
  const rows: [string, string, string][] = [
    ['Morning', 'Buys stocks it wants to own.', 'Buys ₹4,370 cr of stocks it plans to dump by afternoon.'],
    ['Why buy?', 'Thinks the price will rise.', 'To push the index up, so puts get cheap and calls get expensive.'],
    ['Options', 'Maybe buys a few, sized to what it can afford.', 'Builds a ₹32,115 cr bet the other way, 7x the stock position.'],
    ['Afternoon', 'Holds, or sells if the view changes.', 'Sells everything aggressively, pushing the index down into the close.'],
    ['Stock P&L', 'Up or down, depending on the market.', 'A loss of ₹61.6 cr. Expected. It is the cost of the push.'],
    ['Options P&L', 'Small.', '₹735 cr profit, because the index ended where the selling pushed it.'],
  ]
  return (
    <Section id="compare" eyebrow="Step 7" title="Normal trader vs the alleged strategy">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_1fr] bg-panel2 text-xs font-bold uppercase tracking-wider text-mute md:grid-cols-[160px_1fr_1fr]">
          <div className="p-3"></div>
          <div className="p-3 text-blue">Normal trader</div>
          <div className="p-3 text-accent">What SEBI alleges</div>
        </div>
        {rows.map(([k, a, b]) => (
          <div key={k} className="grid grid-cols-[110px_1fr_1fr] border-t border-line text-sm md:grid-cols-[160px_1fr_1fr] md:text-base">
            <div className="p-3 font-bold">{k}</div>
            <div className="p-3 text-mute">{a}</div>
            <div className="p-3">{b}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

export function BiggerPicture() {
  const bars = [
    { label: '15 days, intraday pattern: options profit', v: pattern.intradayOptionsProfitCrore, c: 'var(--color-up)' },
    { label: '15 days, intraday pattern: stock and futures loss', v: pattern.intradayUnderlyingLossCrore, c: 'var(--color-down)' },
    { label: '3 days, closing-hour pattern: options profit', v: pattern.closeOptionsProfitCrore, c: 'var(--color-up)' },
  ]
  const max = Math.max(...bars.map((b) => b.v))
  return (
    <Section id="pattern" eyebrow="Step 8" title="Not one day. SEBI says 18 of them.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-4 p-6">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-sm">
                <span className="text-mute">{b.label}</span>
                <span className="num font-bold" style={{ color: b.c }}>
                  ₹{b.v.toLocaleString('en-IN')} cr
                </span>
              </div>
              <div className="h-5 w-full overflow-hidden rounded bg-panel2">
                <motion.div className="h-full rounded" style={{ background: b.c }} initial={{ width: 0 }} whileInView={{ width: `${Math.max(1.5, (100 * b.v) / max)}%` }} viewport={{ once: true }} transition={{ duration: 1 }} />
              </div>
            </div>
          ))}
          <div className="pt-2 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-mute">Total SEBI ordered impounded</div>
            <div className="num text-4xl font-black text-accent md:text-5xl">₹{pattern.impoundedCrore.toLocaleString('en-IN')} cr</div>
          </div>
        </div>
        <div className="space-y-4">
          <Callout>
            <b>Pattern two, marking the close.</b> On {pattern.closeExample.date} SEBI says the group did nothing unusual until 2:30 pm, then sold about ₹{pattern.closeExample.soldCrore.toLocaleString('en-IN')} crore of bank stocks and futures in the last hour, while holding ₹{Math.round(pattern.closeExample.optionsCrore).toLocaleString('en-IN')} crore of options that paid more the lower the index closed. Options settle on the closing price, so the last hour is where it counts.
          </Callout>
          <Callout tone="blue">
            <b>Over the whole period, {fullPeriod.from} to {fullPeriod.to}:</b> ₹{fullPeriod.indexOptionsProfitCrore.toLocaleString('en-IN')} crore profit in index options, against ₹{fullPeriod.otherLossesCrore.toLocaleString('en-IN')} crore of losses in stocks and futures. SEBI said the profits are not the evidence, the trading pattern is. Only 18 days are covered by the order.
          </Callout>
        </div>
      </div>
    </Section>
  )
}

export function SebiTimeline() {
  return (
    <Section id="sebi" eyebrow="Step 9" title="What happened next">
      <ol className="relative space-y-6 border-l-2 border-line pl-6">
        {timeline.map((t, i) => (
          <motion.li key={t.when} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative">
            <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-ink bg-accent" />
            <div className="text-sm font-bold uppercase tracking-wider text-accent">{t.when}</div>
            <div className="text-mute">{t.what}</div>
          </motion.li>
        ))}
      </ol>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Callout tone="blue">
          <b>Jane Street's side.</b> The firm denies manipulation. It says its trades were ordinary index arbitrage, that buying stocks when the index fell below where futures and options implied it should be is normal market making, and that it followed the rules. The appeal will decide.
        </Callout>
        <Callout>
          <b>SEBI's side.</b> The scale relative to the market, the same-day reversal at a loss, and the timing against enormous option positions on 18 expiry days do not fit any purpose except moving the index. The full order is 105 pages:{' '}
          <a className="underline" href={SEBI_ORDER_URL} target="_blank" rel="noreferrer">
            read it here
          </a>
          .
        </Callout>
      </div>
    </Section>
  )
}

export function CheatSheet() {
  const cards = [
    ['Index', 'A basket of stocks rolled into one number. Bank Nifty is 12 big banks.'],
    ['Call', 'Pays the amount the index finishes above the strike. A bet on up.'],
    ['Put', 'Pays the amount the index finishes below the strike. A bet on down.'],
    ['Buying an option', 'Pay a small premium. Lose at most the premium. Win big if right.'],
    ['Selling an option', 'Collect the premium. Win only that. Lose big if wrong.'],
    ['Expiry day', 'The day options settle on the closing index. Everything comes down to 15:30.'],
    ['Leverage', 'A 2% index move can be a 400% option move. Both ways.'],
    ['The alleged trick', 'Move the small stock market, profit in the huge options market.'],
  ]
  return (
    <Section id="cheatsheet" eyebrow="Keep this" title="Cheat sheet">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([t, d]) => (
          <div key={t} className="card p-5">
            <div className="mb-1 text-lg font-black text-accent">{t}</div>
            <div className="text-sm text-mute">{d}</div>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <h3 className="mb-3 text-2xl font-black">One last quiz</h3>
        <LeverageWidget
          rupees={100}
          initialMove={-2}
          mode="quiz"
          kindChoice
          intro={<>You have ₹100. Pick a call or a put, pick how the index moves, and see if you got it right. Same numbers as the widget in Step 3.</>}
        />
      </div>
    </Section>
  )
}
