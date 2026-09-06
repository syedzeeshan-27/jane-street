import { useState } from 'react'
import { callPrice, moneyness, putPrice } from '../sim/options'
import { Arrow, Big, Callout, Counter, Section, Slider } from './ui'

const STRIKE = 50000
const MID_DAY = 30

export function OptionsBasics() {
  const [kind, setKind] = useState<'call' | 'put'>('call')
  const [index, setIndex] = useState(50000)
  const paid = kind === 'call' ? callPrice(STRIKE, STRIKE, 0) : putPrice(STRIKE, STRIKE, 0)
  const now = kind === 'call' ? callPrice(index, STRIKE, MID_DAY) : putPrice(index, STRIKE, MID_DAY)
  const pnl = now - paid
  const m = moneyness(kind, index, STRIKE)
  const dir = pnl > 1 ? 'up' : pnl < -1 ? 'down' : 'flat'
  return (
    <Section id="options" eyebrow="Step 2" title="Options in 60 seconds">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="card space-y-6 p-6">
          <div className="grid grid-cols-2 gap-2">
            {(['call', 'put'] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`btn ${kind === k ? 'btn-accent' : 'btn-ghost'}`}>
                {k === 'call' ? 'Call: bet it goes UP' : 'Put: bet it goes DOWN'}
              </button>
            ))}
          </div>
          <p className="text-mute">
            You buy the option in the morning at the strike of <b className="text-white">50,000</b>, paying a premium of <b className="text-white">{paid} points</b>. Now drag the index and watch what your option is worth by lunchtime.
          </p>
          <Slider label="Where the index is now" value={index} min={45000} max={55000} step={50} display={index.toLocaleString('en-IN')} onChange={setIndex} />
          <button className="btn btn-ghost w-full" onClick={() => setIndex(50000)}>
            Reset to 50,000
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <span className={`pill ${m === 'ITM' ? 'bg-up/20 text-up' : m === 'OTM' ? 'bg-down/20 text-down' : 'bg-panel2 text-mute'}`}>
            {m === 'ITM' ? 'In the money' : m === 'OTM' ? 'Out of the money' : 'At the money'}
          </span>
          <div className="text-sm font-bold uppercase tracking-widest text-mute">Your {kind} is now worth</div>
          <Big tone={dir === 'flat' ? 'neutral' : dir}>
            <Counter value={now} /> pts
          </Big>
          <Arrow dir={dir} size={48} />
          <div className={`num text-xl font-bold ${dir === 'up' ? 'text-up' : dir === 'down' ? 'text-down' : 'text-mute'}`}>
            {pnl > 0 ? '+' : ''}
            {Math.round(pnl)} points on {paid} paid
          </div>
          <Callout tone="blue">
            {kind === 'call'
              ? 'A call pays you the amount the index finishes ABOVE the strike. Below the strike it is worth nothing. The most you can lose is the premium.'
              : 'A put pays you the amount the index finishes BELOW the strike. Above the strike it is worth nothing. The most you can lose is the premium.'}
          </Callout>
        </div>
      </div>
    </Section>
  )
}
