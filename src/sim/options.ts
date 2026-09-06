import { TICKS } from './clock'

/**
 * Deliberately simple expiry-day option pricing (no Black-Scholes).
 * price = intrinsic value + time value
 * Time value is biggest at the money, shrinks as the index moves away from
 * the strike, and decays to zero at the 15:30 tick.
 * All numbers are index points; multiply by lot size for rupees.
 */
export const MAX_TIME_VALUE = 200 // points, at the money at 09:15
export const TIME_VALUE_RANGE = 1500 // points away from strike where time value hits zero

export function timeValue(index: number, strike: number, tick: number): number {
  const remaining = Math.max(0, 1 - tick / TICKS)
  const moneyness = Math.max(0, 1 - Math.abs(index - strike) / TIME_VALUE_RANGE)
  return MAX_TIME_VALUE * remaining * moneyness
}

export function callPrice(index: number, strike: number, tick: number): number {
  return Math.max(0, index - strike) + timeValue(index, strike, tick)
}

export function putPrice(index: number, strike: number, tick: number): number {
  return Math.max(0, strike - index) + timeValue(index, strike, tick)
}

export type Moneyness = 'ITM' | 'ATM' | 'OTM'

export function moneyness(kind: 'call' | 'put', index: number, strike: number): Moneyness {
  const d = index - strike
  if (Math.abs(d) < 50) return 'ATM'
  if (kind === 'call') return d > 0 ? 'ITM' : 'OTM'
  return d < 0 ? 'ITM' : 'OTM'
}
