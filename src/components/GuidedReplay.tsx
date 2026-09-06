import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { jan17, SEBI_ORDER_URL } from '../data/facts'
import { tickToTime, timeToTick } from '../sim/clock'
import { formatRupees, jan17FairPath, pnl as calcPnl } from '../sim/market'
import { createGameStore, type GameStore } from '../store/game'
import { IndexChart } from './IndexChart'
import { PnlPanel, SizeBars } from './PnlPanel'
import { Arrow, Big, Callout, Counter, Section } from './ui'

const useGame = createGameStore({ startIndex: 46574, strike: 46500, fairPath: jan17FairPath() }, 17)

const BUY = 440_000
const SELL_TICK = timeToTick('11:50')

interface Step {
  title: string
  text: string
  button: string
  run?: number // tick to run to
  act?: (g: GameStore) => void
}

const STEPS: Step[] = [
  {
    title: 'The market opens down',
    text: 'HDFC Bank announced results last night and the market did not like them. Bank Nifty opens 1,550 points below yesterday, at 46,574. You have ₹10 lakh. Everyone else is nervous and volumes in the bank stocks are thin.',
    button: 'Start the clock',
    run: 2,
  },
  {
    title: 'Patch I: buy stocks, hard',
    text: 'Buy ₹4.4 lakh of bank stocks all at once, in a market where nobody else is buying. You become the single biggest buyer. Watch the index.',
    button: 'Buy ₹4.4 L of bank stocks',
    act: (g) => g.buy(BUY, 'Patch I: bought stocks'),
  },
  {
    title: 'Meanwhile, the hidden bet',
    text: 'Because the index just rose, puts became cheap and calls became expensive. Buy 3 lots of puts and sell 2 lots of calls. That is a ₹35 lakh bet that the index will FALL, about 8 times bigger than the stocks you own.',
    button: 'Buy 3 puts + sell 2 calls',
    act: (g) => {
      g.option('put', 3, 'Bought 3 put lots (cheap)')
      g.option('call', -2, 'Sold 2 call lots (expensive)')
    },
  },
  {
    title: 'Let the morning run',
    text: 'Other traders see the index holding up and keep buying calls from you. You sit tight. Notice the index slowly sags as your push wears off.',
    button: 'Run to 11:50',
    run: SELL_TICK,
  },
  {
    title: 'Patch II: dump everything',
    text: 'Sell every share you bought, aggressively. Selling this much this fast pushes the index down, and you sell below what you paid. You lose money on the stocks. That is expected, and it is the price of the push.',
    button: 'Sell all stocks',
    act: (g) => g.sell(Infinity, 'Patch II: sold all stocks'),
  },
  {
    title: 'Run to expiry',
    text: 'The index closes lower than where you propped it up this morning. At 15:30 your puts pay out and the calls you sold expire worthless.',
    button: 'Run to 15:30',
    run: 75,
  },
]

export function GuidedReplay() {
  const g = useGame()
  const s = g.state
  const [stepIdx, setStepIdx] = useState(0)
  const [runTarget, setRunTarget] = useState<number | null>(null)
  const [auto, setAuto] = useState(false)
  const pnl = useMemo(() => calcPnl(s), [s])
  const step = STEPS[stepIdx]
  const done = stepIdx >= STEPS.length

  // ticking toward a run target
  useEffect(() => {
    if (runTarget === null) return
    if (s.tick >= runTarget) {
      setRunTarget(null)
      setStepIdx((i) => i + 1)
      return
    }
    const id = setTimeout(() => g.tick(), 70)
    return () => clearTimeout(id)
  }, [runTarget, s.tick, g])

  // autoplay presses the button for you
  useEffect(() => {
    if (!auto || done || runTarget !== null) return
    const id = setTimeout(() => press(), 1800)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, stepIdx, runTarget, done])

  function press() {
    if (done) return
    if (step.run !== undefined) {
      setRunTarget(step.run)
    } else {
      step.act?.(g)
      setStepIdx((i) => i + 1)
    }
  }

  function reset() {
    g.reset()
    setStepIdx(0)
    setRunTarget(null)
    setAuto(false)
  }

  const lastIdx = s.history[s.history.length - 1]
  const prevIdx = s.history[Math.max(0, s.history.length - 4)]
  const dir = lastIdx - prevIdx > 20 ? 'up' : lastIdx - prevIdx < -20 ? 'down' : 'flat'
  const stocksHeld = s.units * s.index

  return (
    <Section id="replay" eyebrow="Step 5: the centrepiece" title="Do what SEBI says Jane Street did. At a tiny scale.">
      <Callout tone="down">
        <b>Read this first.</b> This is a simplified simulation of the strategy described in{' '}
        <a className="underline" href={SEBI_ORDER_URL} target="_blank" rel="noreferrer">
          SEBI's interim order of 3 July 2025
        </a>
        . It is not a reconstruction of real trades. Numbers are scaled down about 1 crore times and are illustrative, not real. SEBI's order is an interim finding that Jane Street is contesting on appeal.
      </Callout>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-4 md:p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-mute">Bank Nifty, {jan17.date} (illustrative)</div>
              <div className="flex items-center gap-3">
                <Big tone={dir === 'flat' ? 'neutral' : dir} className="!text-4xl">
                  <Counter value={s.index} />
                </Big>
                <Arrow dir={dir} size={36} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-mute">Time</div>
              <div className="num text-3xl font-black">{tickToTime(s.tick)}</div>
            </div>
          </div>
          <IndexChart
            history={s.history}
            strike={s.strike}
            events={s.events}
            prevClose={jan17.prevClose}
            bands={[
              { from: 0, to: SELL_TICK, label: 'Patch I: buy', color: 'var(--color-up)' },
              { from: SELL_TICK, to: 75, label: 'Patch II: sell', color: 'var(--color-down)' },
            ]}
          />
          <div className="mt-4">
            <PnlPanel pnl={pnl} stockValue={stocksHeld} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{done ? 'Expiry' : `Step ${stepIdx + 1} of ${STEPS.length}`}</div>
            <AnimatePresence mode="wait">
              <motion.div key={stepIdx} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                {done ? <Results pnl={pnl} /> : (
                  <>
                    <h3 className="mb-2 text-2xl font-black">{step.title}</h3>
                    <p className="mb-4 text-mute">{step.text}</p>
                    <button className={`btn w-full text-lg ${stepIdx === 1 ? 'btn-up' : stepIdx === 4 ? 'btn-down' : 'btn-accent'}`} onClick={press} disabled={runTarget !== null}>
                      {runTarget !== null ? 'Running...' : step.button}
                    </button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-ghost flex-1" onClick={() => setAuto((a) => !a)} disabled={done}>
                {auto ? 'Pause auto play' : 'Auto play'}
              </button>
              <button className="btn btn-ghost flex-1" onClick={reset}>
                Reset
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-mute">Your positions</div>
            <SizeBars stocks={stocksHeld} options={pnl.notional} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Row k="Cash" v={formatRupees(s.cash)} />
              <Row k="Stocks" v={formatRupees(stocksHeld)} />
              <Row k="Put lots" v={String(s.putLots)} />
              <Row k="Call lots" v={String(s.callLots)} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">What SEBI's order says happened that day (real numbers)</div>
          <ul className="space-y-2 text-mute">
            <li>
              <b className="text-up">09:15 to 11:47:</b> Jane Street net bought <b className="text-white">₹{jan17.patch1.buyCrore.toLocaleString('en-IN')} crore</b> of Bank Nifty stocks and futures, the largest buyer in the market.
            </li>
            <li>
              <b className="text-accent">Same morning:</b> it built <b className="text-white">₹{jan17.patch1.optionsCrore.toLocaleString('en-IN')} crore</b> of bearish option positions, {jan17.patch1.ratio}x the stock buying. In the first 8 minutes alone: ₹572 crore of stocks against ₹8,751 crore of options.
            </li>
            <li>
              <b className="text-down">11:49 to 15:30:</b> it sold <b className="text-white">₹{jan17.patch2.sellCrore.toLocaleString('en-IN')} crore</b> of the same stocks and futures, pushing the index down into the close.
            </li>
            <li>
              <b>Result:</b> stocks and futures lost <b className="text-down">₹{jan17.underlyingLossCrore} crore</b>. Options made <b className="text-up">₹{jan17.optionsProfitCrore} crore</b>.
            </li>
          </ul>
        </div>
        <div className="card p-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">Why SEBI called this manipulation, in plain words</div>
          <ul className="list-disc space-y-2 pl-5 text-mute">
            <li>Buying ₹4,370 crore and selling it all the same day, at a loss, makes no sense on its own.</li>
            <li>It makes sense only if the point was to move the index while holding a much bigger bet on the index.</li>
            <li>Sixteen lakh option traders saw the index rise and fall, without knowing one firm was pushing it.</li>
            <li>SEBI says the same footprint appeared on 15 expiry days, and a related closing-hour version on 3 more.</li>
          </ul>
        </div>
      </div>
    </Section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between rounded bg-panel2 px-3 py-2">
      <span className="text-mute">{k}</span>
      <span className="num font-bold">{v}</span>
    </div>
  )
}

function Results({ pnl }: { pnl: ReturnType<typeof calcPnl> }) {
  return (
    <div>
      <h3 className="mb-2 text-2xl font-black">15:30. Expiry.</h3>
      <p className="mb-3 text-mute">
        You lost <b className="text-down">{formatRupees(Math.abs(pnl.underlying))}</b> on stocks and made <b className="text-up">{formatRupees(pnl.options)}</b> on options. Net{' '}
        <b className={pnl.net >= 0 ? 'text-up' : 'text-down'}>{formatRupees(pnl.net)}</b> on ₹10 lakh.
      </p>
      <p className="text-mute">
        Same shape as the real day: a small loss on the stocks, a much bigger profit on the options. SEBI's actual figures for 17 January 2024: <b className="text-down">₹{jan17.underlyingLossCrore} cr</b> lost on stocks and futures, <b className="text-up">₹{jan17.optionsProfitCrore} cr</b> made on options.
      </p>
      <div className="mt-3 text-xs text-mute">The toy market here is more sensitive than the real one, so your ratio is more extreme. The direction of each number is the point.</div>
    </div>
  )
}
