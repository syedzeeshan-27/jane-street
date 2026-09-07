import { motion } from 'framer-motion'
import { formatRupees, type Pnl } from '../sim/market'
import { Money } from './ui'

export function PnlPanel({ pnl, stockValue, big = false }: { pnl: Pnl; stockValue?: number; big?: boolean }) {
  const size = big ? 'text-2xl sm:text-3xl md:text-5xl' : 'text-lg sm:text-2xl md:text-3xl'
  const tiles = [
    { label: 'Stocks P&L', value: pnl.underlying, hint: stockValue !== undefined ? `holding ${formatRupees(stockValue)}` : undefined },
    { label: 'Options P&L', value: pnl.options, hint: `bet size ${formatRupees(pnl.notional)}` },
    { label: 'Net', value: pnl.net, hint: 'what you actually made' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {tiles.map((t, i) => (
        <motion.div key={t.label} layout className={`card p-2.5 sm:p-4 ${i === 2 ? 'border-accent/60' : ''}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-mute sm:text-xs">{t.label}</div>
          <div className={`font-black break-words ${size}`}>
            <Money value={t.value} />
          </div>
          {t.hint && <div className="mt-1 hidden text-xs text-mute sm:block">{t.hint}</div>}
        </motion.div>
      ))}
    </div>
  )
}

/** Bar showing how much bigger the options bet is than the stock position. */
export function SizeBars({ stocks, options }: { stocks: number; options: number }) {
  const max = Math.max(stocks, options, 1)
  const ratio = stocks > 0 ? options / stocks : 0
  return (
    <div className="space-y-2">
      <Row label="Stocks bought" value={stocks} max={max} color="var(--color-up)" />
      <Row label="Options bet" value={options} max={max} color="var(--color-accent)" />
      {ratio > 0 && <div className="text-sm text-mute">The options bet is <b className="text-accent">{ratio.toFixed(1)}x</b> the stock position.</div>}
    </div>
  )
}

function Row({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-mute">
        <span>{label}</span>
        <span className="num">{formatRupees(value)}</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded bg-panel2">
        <motion.div className="h-full rounded" style={{ background: color }} animate={{ width: `${(100 * value) / max}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
      </div>
    </div>
  )
}
