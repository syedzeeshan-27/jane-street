import { create } from 'zustand'
import { TICKS } from '../sim/clock'
import {
  buyStocks,
  createState,
  optionTradeProblem,
  sellStocks,
  step,
  tradeOption,
  type OptionKind,
  type SimOptions,
  type SimState,
} from '../sim/market'
import { makeRng, type Rng } from '../sim/rng'

export interface GameStore {
  state: SimState
  rng: Rng
  playing: boolean
  /** milliseconds per tick when playing */
  speed: number
  reset: () => void
  tick: () => void
  runTo: (tick: number) => void
  setPlaying: (p: boolean) => void
  setSpeed: (ms: number) => void
  buy: (rupees: number, label?: string) => void
  sell: (rupees: number, label?: string) => void
  option: (kind: OptionKind, lots: number, label?: string) => void
  /** Why the last action was refused, if it was. */
  notice: string | null
  clearNotice: () => void
}

/** Each game (guided replay, sandbox) gets its own store so they never interfere. */
export function createGameStore(opts: SimOptions, seed?: number) {
  const newRng = () => makeRng(seed ?? Math.floor(Math.random() * 1e9))
  return create<GameStore>((set, get) => ({
    state: createState(opts),
    rng: newRng(),
    playing: false,
    speed: 250,
    notice: null,
    clearNotice: () => set({ notice: null }),
    reset: () => set({ state: createState(opts), rng: newRng(), playing: false, notice: null }),
    tick: () => {
      const { state, rng } = get()
      if (state.tick >= TICKS) return set({ playing: false })
      set({ state: step(state, rng) })
    },
    runTo: (target) => {
      let { state } = get()
      const { rng } = get()
      while (state.tick < Math.min(target, TICKS)) state = step(state, rng)
      set({ state })
    },
    setPlaying: (playing) => set({ playing }),
    setSpeed: (speed) => set({ speed }),
    buy: (rupees, label) => {
      const s = get().state
      if (s.settled) return set({ notice: 'The day is over. Press Reset to play again.' })
      if (s.cash < 1) return set({ notice: 'No cash left. Sell some stocks to free up money.' })
      set({ state: buyStocks(s, rupees, label), notice: null })
    },
    sell: (rupees, label) => {
      const s = get().state
      if (s.settled) return set({ notice: 'The day is over. Press Reset to play again.' })
      if (s.units < 1e-9) return set({ notice: 'You do not own any stocks to sell.' })
      set({ state: sellStocks(s, rupees, label), notice: null })
    },
    option: (kind, lots, label) => {
      const s = get().state
      const problem = optionTradeProblem(s, kind, lots)
      if (problem) return set({ notice: problem })
      set({ state: tradeOption(s, kind, lots, label), notice: null })
    },
  }))
}
