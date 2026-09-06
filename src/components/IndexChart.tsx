import { Line, LineChart, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { tickToTime, TICKS } from '../sim/clock'
import type { MarketEvent } from '../sim/market'

interface Band {
  from: number
  to: number
  label: string
  color: string
}

export function IndexChart({ history, strike, events, bands = [], prevClose, height = 300 }: { history: number[]; strike: number; events: MarketEvent[]; bands?: Band[]; prevClose?: number; height?: number }) {
  const data = history.map((index, tick) => ({ tick, index }))
  const all = [...history, strike, ...(prevClose ? [prevClose] : [])]
  const lo = Math.floor((Math.min(...all) - 300) / 100) * 100
  const hi = Math.ceil((Math.max(...all) + 300) / 100) * 100
  const last = history[history.length - 1]
  const colors: Record<MarketEvent['kind'], string> = { 'stocks-buy': 'var(--color-up)', 'stocks-sell': 'var(--color-down)', option: 'var(--color-accent)', info: 'var(--color-mute)' }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <XAxis type="number" dataKey="tick" domain={[0, TICKS]} ticks={[0, 15, 30, 45, 60, 75]} tickFormatter={tickToTime} stroke="var(--color-mute)" fontSize={12} />
          <YAxis domain={[lo, hi]} stroke="var(--color-mute)" fontSize={12} width={56} tickFormatter={(v) => v.toLocaleString('en-IN')} />
          <Tooltip
            contentStyle={{ background: 'var(--color-panel2)', border: '1px solid var(--color-line)', borderRadius: 8 }}
            labelFormatter={(t) => tickToTime(Number(t))}
            formatter={(v) => [Math.round(Number(v)).toLocaleString('en-IN'), 'Index']}
          />
          {bands.map((b) => (
            <ReferenceArea key={b.label} x1={b.from} x2={b.to} fill={b.color} fillOpacity={0.12} label={{ value: b.label, position: 'insideTop', fill: b.color, fontSize: 12, fontWeight: 700 }} />
          ))}
          <ReferenceLine y={strike} stroke="var(--color-accent)" strokeDasharray="4 4" label={{ value: `Strike ${strike.toLocaleString('en-IN')}`, position: 'right', fill: 'var(--color-accent)', fontSize: 11 }} />
          {prevClose && <ReferenceLine y={prevClose} stroke="var(--color-mute)" strokeDasharray="2 6" label={{ value: 'Prev close', position: 'right', fill: 'var(--color-mute)', fontSize: 11 }} />}
          <Line type="monotone" dataKey="index" stroke="#e8ecf5" strokeWidth={3} dot={false} isAnimationActive={false} />
          {events.map((e, i) => (
            <ReferenceDot key={i} x={e.tick} y={history[e.tick] ?? last} r={7} fill={colors[e.kind]} stroke="var(--color-ink)" strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
