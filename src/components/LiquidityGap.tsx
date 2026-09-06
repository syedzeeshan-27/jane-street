import { motion } from 'framer-motion'
import { liquidity } from '../data/facts'
import { Callout, Section } from './ui'

const rows = [
  { label: 'Bank stocks (cash market)', value: liquidity.cash, color: 'var(--color-up)' },
  { label: 'Bank stock futures', value: liquidity.stockFutures, color: 'var(--color-blue)' },
  { label: 'Bank Nifty futures', value: liquidity.indexFutures, color: 'var(--color-blue)' },
  { label: 'Bank Nifty OPTIONS', value: liquidity.options, color: 'var(--color-accent)' },
]

export function LiquidityGap() {
  const max = liquidity.options
  return (
    <Section id="pond" eyebrow="Step 4" title="A small pond feeding a giant lake">
      <p className="mb-6 max-w-3xl text-mute">
        Option prices are set by the index. The index is set by the stocks. But on expiry day almost nobody trades the stocks, and everybody trades the options. Here is the money traded on 17 January 2024, in ₹ crore, from SEBI's order.
      </p>
      <div className="card space-y-4 p-6">
        {rows.map((r, i) => (
          <div key={r.label}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{r.label}</span>
              <span className="num font-bold" style={{ color: r.color }}>
                ₹{r.value.toLocaleString('en-IN')} cr
              </span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded bg-panel2">
              <motion.div
                className="h-full rounded"
                style={{ background: r.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(0.6, (100 * r.value) / max)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: i * 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat n={`${liquidity.optionsVsAll}x`} t="options traded vs stocks + futures combined" />
        <Stat n={liquidity.entitiesCash.toLocaleString('en-IN')} t="people traded the top 3 bank stocks that day" />
        <Stat n={liquidity.entitiesOptions.toLocaleString('en-IN')} t="people traded Bank Nifty options that day" />
      </div>
      <div className="mt-6">
        <Callout>
          <b>This is the loophole.</b> Spend a few thousand crore in the small pond and you can shift the water level. Sixteen lakh people in the giant lake trade off that water level without ever looking at the pond.
        </Callout>
      </div>
    </Section>
  )
}

function Stat({ n, t }: { n: string; t: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="num text-3xl font-black text-accent md:text-4xl">{n}</div>
      <div className="mt-1 text-sm text-mute">{t}</div>
    </div>
  )
}
