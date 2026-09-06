import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { callPrice, putPrice } from '../sim/options'
import { Callout, Counter, Slider } from './ui'

const INDEX = 50000
const STRIKE = 50000
const LATER = 60 // 14:15, most of the time value has decayed

/**
 * One widget, reused three times. Given rupees committed and an index move,
 * shows how much bigger the option's percentage move is than the index's.
 * Pricing comes from the same options model as the rest of the site.
 */
export function LeverageWidget({ rupees, initialMove = 2, mode = 'demo', intro, kindChoice = false }: { rupees: number; initialMove?: number; mode?: 'demo' | 'quiz'; intro?: ReactNode; kindChoice?: boolean }) {
  const [move, setMove] = useState(initialMove)
  const [kind, setKind] = useState<'call' | 'put'>('call')
  const [revealed, setRevealed] = useState(mode === 'demo')

  const paid = kind === 'call' ? callPrice(INDEX, STRIKE, 0) : putPrice(INDEX, STRIKE, 0)
  const later = INDEX * (1 + move / 100)
  const worth = kind === 'call' ? callPrice(later, STRIKE, LATER) : putPrice(later, STRIKE, LATER)
  const optionPct = ((worth - paid) / paid) * 100
  const value = (rupees * worth) / paid
  const profit = value - rupees
  const tone = profit > 0 ? 'text-up' : profit < 0 ? 'text-down' : 'text-white'

  return (
    <div className="card p-6">
      {intro && <div className="mb-4 text-mute">{intro}</div>}
      {kindChoice && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(['call', 'put'] as const).map((k) => (
            <button key={k} onClick={() => { setKind(k); setRevealed(mode === 'demo') }} className={`btn ${kind === k ? 'btn-accent' : 'btn-ghost'}`}>
              Buy a {k}
            </button>
          ))}
        </div>
      )}
      <Slider label="Index move by 2:15 pm" value={move} min={-5} max={5} step={0.5} display={`${move > 0 ? '+' : ''}${move.toFixed(1)}%`} onChange={(v) => { setMove(v); if (mode === 'quiz') setRevealed(false) }} />
      {mode === 'quiz' && !revealed && (
        <button className="btn btn-accent mt-4 w-full" onClick={() => setRevealed(true)}>
          Show me what happened to my ₹{rupees}
        </button>
      )}
      {revealed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-mute">You paid</div>
              <div className="num text-3xl font-black">₹{rupees}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-mute">Now worth</div>
              <div className={`num text-3xl font-black ${tone}`}>
                ₹<Counter value={value} format={(v) => v.toFixed(0)} />
              </div>
            </div>
          </div>
          <Bar label="Index moved" pct={move} max={60} />
          <Bar label={`Your ${kind} moved`} pct={optionPct} max={600} />
          <div className={`text-center text-lg font-bold ${tone}`}>
            {profit >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(profit).toFixed(0)} ({optionPct > 0 ? '+' : ''}{optionPct.toFixed(0)}%)
          </div>
          {mode === 'quiz' && (
            <Callout tone={profit > 0 ? 'accent' : 'down'}>
              {profit > 0
                ? `Right direction. A ${move > 0 ? 'rise' : 'fall'} of ${Math.abs(move)}% in the index turned into a ${optionPct.toFixed(0)}% gain on your ${kind}. That is leverage.`
                : `Wrong direction. Your ${kind} needed the index to go ${kind === 'call' ? 'up' : 'down'}. It went the other way, so the option is worth almost nothing. You lost most of the premium, but never more than the premium.`}
            </Callout>
          )}
        </motion.div>
      )}
    </div>
  )
}

function Bar({ label, pct, max }: { label: string; pct: number; max: number }) {
  const w = Math.min(100, (Math.abs(pct) / max) * 100)
  const color = pct >= 0 ? 'var(--color-up)' : 'var(--color-down)'
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-mute">{label}</span>
        <span className="num font-bold" style={{ color }}>
          {pct > 0 ? '+' : ''}
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-5 w-full overflow-hidden rounded bg-panel2">
        <motion.div className="h-full rounded" style={{ background: color }} animate={{ width: `${w}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
      </div>
    </div>
  )
}
