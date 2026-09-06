import { useState } from 'react'
import { STOCKS } from '../sim/market'
import { Arrow, Big, Callout, Counter, Section, Slider } from './ui'

const BASE_INDEX = 50000

export function IndexBuilder() {
  const [pct, setPct] = useState<number[]>(STOCKS.map(() => 0))
  const index = BASE_INDEX * STOCKS.reduce((acc, s, i) => acc + s.weight * (1 + pct[i] / 100), 0)
  const change = index - BASE_INDEX
  const dir = Math.abs(change) < 1 ? 'flat' : change > 0 ? 'up' : 'down'
  return (
    <Section id="index" eyebrow="Step 1" title="An index is just a basket of stocks">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="card space-y-5 p-6">
          {STOCKS.map((s, i) => (
            <Slider
              key={s.name}
              label={`${s.name} (${Math.round(s.weight * 100)}% of the index)`}
              value={pct[i]}
              min={-10}
              max={10}
              step={0.5}
              display={`${pct[i] > 0 ? '+' : ''}${pct[i].toFixed(1)}%`}
              onChange={(v) => setPct(pct.map((p, j) => (j === i ? v : p)))}
            />
          ))}
          <button className="btn btn-ghost w-full" onClick={() => setPct(STOCKS.map(() => 0))}>
            Reset
          </button>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-sm font-bold uppercase tracking-widest text-mute">Bank Nifty (pretend)</div>
          <Big tone={dir === 'flat' ? 'neutral' : dir}>
            <Counter value={index} />
          </Big>
          <Arrow dir={dir} />
          <div className={`num text-xl font-bold ${dir === 'up' ? 'text-up' : dir === 'down' ? 'text-down' : 'text-mute'}`}>
            {change > 0 ? '+' : ''}
            {Math.round(change).toLocaleString('en-IN')} points
          </div>
          <Callout>
            Move HDFC Bank by 2% and the index moves more than moving Kotak by 2%. <b>Big stocks drag the index with them.</b> If you can move the big stocks, you move the index.
          </Callout>
        </div>
      </div>
    </Section>
  )
}
