import { TICKS } from './clock'
import { callPrice, putPrice } from './options'
import { gauss, type Rng } from './rng'

/** Five familiar bank names. Prices are derived from the index (illustrative only). */
export const STOCKS = [
  { name: 'HDFC Bank', weight: 0.3, base: 1600 },
  { name: 'ICICI Bank', weight: 0.25, base: 1000 },
  { name: 'SBI', weight: 0.2, base: 620 },
  { name: 'Axis Bank', weight: 0.15, base: 1050 },
  { name: 'Kotak Bank', weight: 0.1, base: 1800 },
] as const

/** How far the index moves per rupee of aggressive buying or selling by the player. */
export const RUPEES_PER_POINT = 800
/** A single order can move the index at most this fraction. */
export const MAX_IMPACT_FRACTION = 0.02
/** Share of a price push that sticks (the rest fades back toward fair value). */
export const PERMANENT_IMPACT = 0.4
/** Per tick, the index closes this fraction of the gap to fair value. */
export const REVERSION = 0.05
/** Random noise from other traders per tick, in index points. */
export const NOISE_POINTS = 15

export const LOT_SIZE = 15
export const MAX_LOTS = 10

export type OptionKind = 'call' | 'put'

export interface MarketEvent {
  tick: number
  label: string
  kind: 'stocks-buy' | 'stocks-sell' | 'option' | 'info'
}

export interface SimState {
  tick: number
  index: number
  fair: number
  startIndex: number
  strike: number
  /** fair value path if given (guided replay); otherwise a random walk */
  fairPath?: number[]
  history: number[]
  cash: number
  startCash: number
  units: number
  avgCost: number
  realisedUnderlying: number
  callLots: number
  callNetCost: number
  putLots: number
  putNetCost: number
  events: MarketEvent[]
  settled: boolean
}

export interface SimOptions {
  startIndex?: number
  strike?: number
  cash?: number
  fairPath?: number[]
}

export function createState(o: SimOptions = {}): SimState {
  const startIndex = o.startIndex ?? 50000
  const strike = o.strike ?? Math.round(startIndex / 100) * 100
  return {
    tick: 0,
    index: startIndex,
    fair: o.fairPath ? o.fairPath[0] : startIndex,
    startIndex,
    strike,
    fairPath: o.fairPath,
    history: [startIndex],
    cash: o.cash ?? 1_000_000,
    startCash: o.cash ?? 1_000_000,
    units: 0,
    avgCost: 0,
    realisedUnderlying: 0,
    callLots: 0,
    callNetCost: 0,
    putLots: 0,
    putNetCost: 0,
    events: [],
    settled: false,
  }
}

export function stockPrice(s: SimState, i: number): number {
  return (STOCKS[i].base * s.index) / s.startIndex
}

/** Advance the clock one tick. Index drifts toward fair value plus noise. */
export function step(s: SimState, rng: Rng): SimState {
  if (s.tick >= TICKS) return s
  const tick = s.tick + 1
  let fair = s.fair
  if (s.fairPath) {
    // keep any permanent impact the player has caused on top of the scripted path
    const at = (t: number) => s.fairPath![Math.min(t, s.fairPath!.length - 1)]
    fair = s.fair + (at(tick) - at(s.tick))
  } else {
    fair = s.fair + gauss(rng) * NOISE_POINTS * 0.6
  }
  const index = s.index + REVERSION * (fair - s.index) + gauss(rng) * NOISE_POINTS
  const next: SimState = { ...s, tick, fair, index, history: [...s.history, index] }
  return tick >= TICKS ? settle(next) : next
}

function impactPoints(s: SimState, rupees: number): number {
  const raw = rupees / RUPEES_PER_POINT
  const cap = s.index * MAX_IMPACT_FRACTION
  return Math.max(-cap, Math.min(cap, raw))
}

/** Aggressively buy `rupees` worth of the basket. Pushes the index up, fills at the average price. */
export function buyStocks(s: SimState, rupees: number, label = 'Bought stocks'): SimState {
  if (s.settled) return s
  rupees = Math.max(0, Math.min(rupees, s.cash))
  if (rupees <= 0) return s
  const move = impactPoints(s, rupees)
  const fill = s.index + move / 2
  const units = rupees / fill
  const totalCost = s.avgCost * s.units + rupees
  const newUnits = s.units + units
  return {
    ...s,
    index: s.index + move,
    fair: s.fair + move * PERMANENT_IMPACT,
    cash: s.cash - rupees,
    units: newUnits,
    avgCost: totalCost / newUnits,
    history: [...s.history.slice(0, -1), s.index + move],
    events: [...s.events, { tick: s.tick, label: `${label} ${formatRupees(rupees)}`, kind: 'stocks-buy' }],
  }
}

/** Aggressively sell `rupees` worth (valued at the current index). Pushes the index down. */
export function sellStocks(s: SimState, rupees: number, label = 'Sold stocks'): SimState {
  if (s.settled) return s
  const holdingValue = s.units * s.index
  rupees = Math.max(0, Math.min(rupees, holdingValue))
  if (rupees <= 0) return s
  const move = -impactPoints(s, rupees)
  const fill = s.index + move / 2
  const units = Math.min(s.units, rupees / s.index)
  const proceeds = units * fill
  const realised = (fill - s.avgCost) * units
  const newUnits = s.units - units
  return {
    ...s,
    index: s.index + move,
    fair: s.fair + move * PERMANENT_IMPACT,
    cash: s.cash + proceeds,
    units: newUnits,
    avgCost: newUnits < 1e-9 ? 0 : s.avgCost,
    realisedUnderlying: s.realisedUnderlying + realised,
    history: [...s.history.slice(0, -1), s.index + move],
    events: [...s.events, { tick: s.tick, label: `${label} ${formatRupees(proceeds)}`, kind: 'stocks-sell' }],
  }
}

export function optionPrice(s: SimState, kind: OptionKind): number {
  return kind === 'call' ? callPrice(s.index, s.strike, s.tick) : putPrice(s.index, s.strike, s.tick)
}

/** Rupees paid (positive) or received (negative) for an option trade. */
export function optionPremium(s: SimState, kind: OptionKind, lots: number): number {
  return optionPrice(s, kind) * LOT_SIZE * lots
}

/** Why an option trade would be refused, or null if it is allowed. */
export function optionTradeProblem(s: SimState, kind: OptionKind, lots: number): string | null {
  if (s.settled) return 'The day is over. Press Reset to play again.'
  if (lots === 0) return null
  const current = kind === 'call' ? s.callLots : s.putLots
  const other = kind === 'call' ? s.putLots : s.callLots
  if (Math.abs(current + lots) + Math.abs(other) > MAX_LOTS) return `That would take you past the ${MAX_LOTS} lot limit.`
  const premium = optionPremium(s, kind, lots)
  if (premium > s.cash) return `Buying ${lots} ${kind} lot${lots > 1 ? 's' : ''} costs ${formatRupees(premium)} in premium but you only have ${formatRupees(s.cash)} cash. Sell some stocks first, or keep cash aside before buying stocks.`
  return null
}

/** Buy (lots > 0) or sell (lots < 0) option lots. Options are so liquid the player cannot move their price. */
export function tradeOption(s: SimState, kind: OptionKind, lots: number, label?: string): SimState {
  if (optionTradeProblem(s, kind, lots) !== null || lots === 0) return s
  const premium = optionPremium(s, kind, lots)
  const verb = lots > 0 ? 'Bought' : 'Sold'
  const n = Math.abs(lots)
  const ev: MarketEvent = {
    tick: s.tick,
    label: label ?? `${verb} ${n} ${kind} lot${n > 1 ? 's' : ''}`,
    kind: 'option',
  }
  if (kind === 'call') {
    return { ...s, cash: s.cash - premium, callLots: s.callLots + lots, callNetCost: s.callNetCost + premium, events: [...s.events, ev] }
  }
  return { ...s, cash: s.cash - premium, putLots: s.putLots + lots, putNetCost: s.putNetCost + premium, events: [...s.events, ev] }
}

export interface Pnl {
  underlying: number
  options: number
  net: number
  stockValue: number
  optionValue: number
  notional: number
}

export function pnl(s: SimState): Pnl {
  const stockValue = s.units * s.index
  const underlying = s.realisedUnderlying + (s.index - s.avgCost) * s.units
  const callValue = s.callLots * LOT_SIZE * optionPrice(s, 'call')
  const putValue = s.putLots * LOT_SIZE * optionPrice(s, 'put')
  const options = callValue - s.callNetCost + (putValue - s.putNetCost)
  const notional = (Math.abs(s.callLots) + Math.abs(s.putLots)) * LOT_SIZE * s.index
  return { underlying, options, net: underlying + options, stockValue, optionValue: callValue + putValue, notional }
}

/** At 15:30 everything is cashed out at the closing index. */
export function settle(s: SimState): SimState {
  if (s.settled) return s
  const p = pnl(s)
  return {
    ...s,
    cash: s.startCash + p.net,
    units: 0,
    avgCost: 0,
    realisedUnderlying: p.underlying,
    settled: true,
    events: [...s.events, { tick: s.tick, label: 'Expiry. Options settled at the closing index.', kind: 'info' }],
  }
}

export function formatRupees(v: number): string {
  const sign = v < 0 ? '-' : ''
  const a = Math.abs(v)
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)} cr`
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)} L`
  return `${sign}₹${Math.round(a).toLocaleString('en-IN')}`
}

/** Buy-and-hold benchmark: put all cash in the basket at the open, sell at the close. */
export function honestTraderPnl(s: SimState): number {
  const open = s.history[0]
  return (s.startCash / open) * (s.index - open)
}

/** Scripted fair-value path for 17 Jan 2024: gap down at the open, gentle drift lower through the day. */
export function jan17FairPath(): number[] {
  const open = 46574
  const end = 46200
  return Array.from({ length: TICKS + 1 }, (_, t) => open + ((end - open) * t) / TICKS)
}
