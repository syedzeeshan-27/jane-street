import { create } from 'zustand'
import { TICKS } from '../sim/clock'
import {
  buyStocks,
  createState,
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
}

/** Each game (guided replay, sandbox) gets its own store so they never interfere. */
export function createGameStore(opts: SimOptions, seed?: number) {
  const newRng = () => makeRng(seed ?? Math.floor(Math.random() * 1e9))
  return create<GameStore>((set, get) => ({
    state: createState(opts),
    rng: newRng(),
    playing: false,
    speed: 250,
    reset: () => set({ state: createState(opts), rng: newRng(), playing: false }),
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
    buy: (rupees, label) => set({ state: buyStocks(get().state, rupees, label) }),
    sell: (rupees, label) => set({ state: sellStocks(get().state, rupees, label) }),
    option: (kind, lots, label) => set({ state: tradeOption(get().state, kind, lots, label) }),
  }))
}
