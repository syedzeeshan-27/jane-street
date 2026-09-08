import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { tickToTime } from '../sim/clock'
import { formatRupees, honestTraderPnl, LOT_SIZE, MAX_LOTS, optionPremium, optionPrice, optionTradeProblem, pnl as calcPnl } from '../sim/market'
import { createGameStore } from '../store/game'
import { IndexChart } from './IndexChart'
import { PnlPanel, SizeBars } from './PnlPanel'
import { Arrow, Big, Callout, Counter, Section, Slider } from './ui'

const useGame = createGameStore({ startIndex: 50000, strike: 50000 })
const BEST_KEY = 'expiry-day-best'

function readBest(): number | null {
  try {
    const v = localStorage.getItem(BEST_KEY)
    return v ? Number(v) : null
  } catch {
    return null
  }
}

export function Sandbox() {
  const g = useGame()
  const s = g.state
  const pnl = useMemo(() => calcPnl(s), [s])
  const [size, setSize] = useState(200_000)
  const [lots, setLots] = useState(2)
  const [best, setBest] = useState<number | null>(readBest)

  useEffect(() => {
    if (!g.playing || s.settled) return
    const id = setInterval(() => g.tick(), g.speed)
    return () => clearInterval(id)
  }, [g.playing, g.speed, s.settled, g])

  useEffect(() => {
    if (!s.settled) return
    if (best === null || pnl.net > best) {
      setBest(pnl.net)
      try {
        localStorage.setItem(BEST_KEY, String(pnl.net))
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.settled])

  const lastIdx = s.history[s.history.length - 1]
  const prevIdx = s.history[Math.max(0, s.history.length - 4)]
  const dir = lastIdx - prevIdx > 20 ? 'up' : lastIdx - prevIdx < -20 ? 'down' : 'flat'
  const stocksHeld = s.units * s.index
  const honest = honestTraderPnl(s)
  const usedLots = Math.abs(s.callLots) + Math.abs(s.putLots)
  const callPx = optionPrice(s, 'call')
  const putPx = optionPrice(s, 'put')
  const buyPutCost = optionPremium(s, 'put', lots)
  const buyCallCost = optionPremium(s, 'call', lots)
  const canBuyPut = optionTradeProblem(s, 'put', lots) === null
  const canBuyCall = optionTradeProblem(s, 'call', lots) === null
  const canSellCall = optionTradeProblem(s, 'call', -lots) === null
  const canSellPut = optionTradeProblem(s, 'put', -lots) === null

  return (
    <Section id="sandbox" eyebrow="Step 6" title="Now try it yourself">
      <p className="mb-4 max-w-3xl text-mute">
        A fresh, random expiry day. Bank Nifty starts at 50,000, you have ₹10 lakh, and you are big enough to move the market. Press play, then buy, sell, and bet. Can you beat the honest trader who just buys at the open and holds?
      </p>
      <div className="card mb-6 p-4 md:p-5">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">The recipe SEBI described, in four clicks</div>
        <ol className="grid gap-2 text-sm text-mute md:grid-cols-4">
          <li><b className="text-up">1. Buy stocks</b> with about half your cash. The index jumps. Keep the rest as cash for the next step.</li>
          <li><b className="text-accent">2. Buy puts and sell calls</b> right away, while puts are cheap and calls are expensive. Bet bigger than your stocks.</li>
          <li><b className="text-mute">3. Wait</b> until about 11:45. Watch other traders keep the index up.</li>
          <li><b className="text-down">4. Sell all stocks</b> in a few big orders. The index drops. Let the clock run to 15:30.</li>
        </ol>
      </div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card min-w-0 p-3 sm:p-4 md:p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Big tone={dir === 'flat' ? 'neutral' : dir} className="!text-4xl">
                <Counter value={s.index} />
              </Big>
              <Arrow dir={dir} size={36} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="num text-2xl font-black">{tickToTime(s.tick)}</span>
              <button className={`btn ${g.playing ? 'btn-ghost' : 'btn-accent'}`} onClick={() => g.setPlaying(!g.playing)} disabled={s.settled}>
                {g.playing ? 'Pause' : s.tick === 0 ? 'Play' : 'Resume'}
              </button>
              <select className="rounded-lg border border-line bg-panel2 px-2 py-2 text-sm" value={g.speed} onChange={(e) => g.setSpeed(Number(e.target.value))}>
                <option value={500}>Slow</option>
                <option value={250}>Normal</option>
                <option value={80}>Fast</option>
              </select>
              <button className="btn btn-ghost" onClick={() => g.reset()}>
                Reset
              </button>
            </div>
          </div>
          <IndexChart history={s.history} strike={s.strike} events={s.events} />
          <div className="mt-4">
            <PnlPanel pnl={pnl} stockValue={stocksHeld} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-panel2 px-4 py-2 text-sm">
            <span className="text-mute">Honest trader (bought ₹10 L at the open, holding):</span>
            <span className={`num font-bold ${honest >= 0 ? 'text-up' : 'text-down'}`}>{honest > 0 ? '+' : ''}{formatRupees(honest)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card space-y-4 p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-mute">Stocks (moves the index)</div>
            <Slider label="Order size" value={size} min={50_000} max={1_000_000} step={50_000} display={formatRupees(size)} onChange={setSize} />
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-up" onClick={() => g.buy(size)} disabled={s.settled || s.cash < 1}>
                Buy stocks
              </button>
              <button className="btn btn-down" onClick={() => g.sell(size)} disabled={s.settled || s.units < 1e-6}>
                Sell stocks
              </button>
            </div>
            <div className="text-xs text-mute">Cash {formatRupees(s.cash)}. Holding {formatRupees(stocksHeld)}.</div>
          </div>

          <div className="card space-y-4 p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-mute">Options (does NOT move the index)</div>
            <Slider label="Lots" value={lots} min={1} max={MAX_LOTS} display={`${lots} lot${lots > 1 ? 's' : ''} = ${formatRupees(lots * LOT_SIZE * s.index)} bet`} onChange={setLots} />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-panel2 px-3 py-2">
                Call <span className="num float-right font-bold">{callPx.toFixed(0)} pts</span>
              </div>
              <div className="rounded bg-panel2 px-3 py-2">
                Put <span className="num float-right font-bold">{putPx.toFixed(0)} pts</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <OptBtn label="Buy put" sub={`bet on fall, pay ${formatRupees(buyPutCost)}`} ok={canBuyPut} onClick={() => g.option('put', lots)} />
              <OptBtn label="Sell call" sub={`bet on fall, receive ${formatRupees(-optionPremium(s, 'call', -lots))}`} ok={canSellCall} onClick={() => g.option('call', -lots)} />
              <OptBtn label="Buy call" sub={`bet on rise, pay ${formatRupees(buyCallCost)}`} ok={canBuyCall} onClick={() => g.option('call', lots)} />
              <OptBtn label="Sell put" sub={`bet on rise, receive ${formatRupees(-optionPremium(s, 'put', -lots))}`} ok={canSellPut} onClick={() => g.option('put', -lots)} />
            </div>
            <div className="text-xs text-mute">
              Using {usedLots} of {MAX_LOTS} lots. Puts {s.putLots}, calls {s.callLots}. A negative number means you sold. Buying costs premium from your cash; selling pays you premium.
            </div>
            {g.notice && (
              <div className="rounded-lg border border-down/60 bg-down/10 px-3 py-2 text-sm">
                {g.notice}
                <button className="ml-2 underline" onClick={g.clearNotice}>ok</button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <SizeBars stocks={stocksHeld} options={pnl.notional} />
            {best !== null && <div className="mt-3 text-xs text-mute">Your best day so far: {formatRupees(best)}</div>}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {s.settled && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
            <div className="card border-accent/60 p-6">
              <h3 className="mb-3 text-2xl font-black">15:30. The day is over.</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Score label="You" v={pnl.net} />
                <Score label="Honest trader" v={honest} />
                <Score label="Options share of your result" v={pnl.options} />
              </div>
              <div className="mt-4">
                <Callout>
                  {pnl.options > 0 && pnl.underlying < 0
                    ? 'You lost on stocks and made it back many times over on options. That is the pattern SEBI called manipulation. It only works if you are big enough to move the index, and only if nobody notices.'
                    : pnl.net > honest
                      ? 'You beat buy and hold. Try the full pattern: buy stocks, then bet against the index with options, then sell the stocks before the close.'
                      : 'Buy and hold did as well or better. The trick is not to predict the index. It is to move it, while holding a much bigger bet on it.'}
                </Callout>
              </div>
              <button className="btn btn-accent mt-4" onClick={() => g.reset()}>
                Play another day
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  )
}

function OptBtn({ label, sub, ok, onClick }: { label: string; sub: string; ok: boolean; onClick: () => void }) {
  return (
    <button className={`btn flex flex-col items-center px-2 py-2 ${ok ? 'btn-ghost' : 'btn-ghost opacity-50'}`} onClick={onClick} title={ok ? '' : 'Click to see why this is not possible right now'}>
      <span>{label}</span>
      <span className="num text-[11px] font-normal text-mute">{sub}</span>
    </button>
  )
}

function Score({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-panel2 p-4 text-center">
      <div className="text-xs font-bold uppercase tracking-wider text-mute">{label}</div>
      <div className={`num text-3xl font-black ${v > 0 ? 'text-up' : v < 0 ? 'text-down' : ''}`}>
        {v > 0 ? '+' : ''}
        {formatRupees(v)}
      </div>
    </div>
  )
}
