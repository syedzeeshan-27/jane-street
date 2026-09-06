import { describe, expect, it } from 'vitest'
import { TICKS, tickToTime, timeToTick } from '../clock'
import { callPrice, moneyness, putPrice, timeValue } from '../options'
import { buyStocks, createState, honestTraderPnl, LOT_SIZE, pnl, sellStocks, step, tradeOption } from '../market'
import { makeRng } from '../rng'

const quiet = () => 0.5 // gauss(quiet) = 0 so the index only moves from trades and reversion

describe('clock', () => {
  it('maps ticks to times', () => {
    expect(tickToTime(0)).toBe('09:15')
    expect(tickToTime(TICKS)).toBe('15:30')
    expect(timeToTick('11:45')).toBe(30)
  })
})

describe('options', () => {
  it('is worth only intrinsic value at expiry', () => {
    expect(callPrice(50500, 50000, TICKS)).toBe(500)
    expect(putPrice(50500, 50000, TICKS)).toBe(0)
    expect(putPrice(49000, 50000, TICKS)).toBe(1000)
  })
  it('has time value at the open that shrinks away from the strike', () => {
    expect(timeValue(50000, 50000, 0)).toBe(200)
    expect(timeValue(50750, 50000, 0)).toBeCloseTo(100)
    expect(timeValue(52000, 50000, 0)).toBe(0)
  })
  it('puts get cheaper and calls dearer when the index rises', () => {
    expect(putPrice(50600, 50000, 10)).toBeLessThan(putPrice(50000, 50000, 10))
    expect(callPrice(50600, 50000, 10)).toBeGreaterThan(callPrice(50000, 50000, 10))
  })
  it('labels moneyness', () => {
    expect(moneyness('call', 50600, 50000)).toBe('ITM')
    expect(moneyness('put', 50600, 50000)).toBe('OTM')
    expect(moneyness('put', 50010, 50000)).toBe('ATM')
  })
})

describe('market impact', () => {
  it('buying pushes the index up, selling pushes it down', () => {
    const s0 = createState()
    const s1 = buyStocks(s0, 400_000)
    expect(s1.index).toBeGreaterThan(s0.index)
    expect(s1.cash).toBe(600_000)
    const s2 = sellStocks(s1, 400_000)
    expect(s2.index).toBeLessThan(s1.index)
  })
  it('caps the impact of one huge order', () => {
    const s = buyStocks(createState({ cash: 1e9 }), 1e9)
    expect(s.index).toBeLessThanOrEqual(50000 * 1.02 + 1e-6)
  })
  it('a round trip of buy then sell loses money because you push the price against yourself', () => {
    let s = createState()
    s = buyStocks(s, 500_000)
    for (let i = 0; i < 5; i++) s = step(s, quiet)
    s = sellStocks(s, s.units * s.index)
    expect(pnl(s).underlying).toBeLessThan(0)
    expect(s.units).toBeCloseTo(0)
  })
  it('index drifts back toward fair value when nobody pushes', () => {
    let s = buyStocks(createState(), 500_000)
    const pushed = s.index
    for (let i = 0; i < 20; i++) s = step(s, quiet)
    expect(s.index).toBeLessThan(pushed)
    expect(s.index).toBeGreaterThan(50000)
  })
})

describe('the alleged strategy at tiny scale', () => {
  it('loses on stocks, wins much more on options, net positive', () => {
    let s = createState({ startIndex: 46574, strike: 46500 })
    s = buyStocks(s, 440_000) // Patch I: push the index up
    s = tradeOption(s, 'put', 3) // puts are now cheap
    s = tradeOption(s, 'call', -2) // calls are now expensive
    for (let i = 0; i < 30; i++) s = step(s, quiet)
    s = sellStocks(s, s.units * s.index) // Patch II: dump everything
    while (s.tick < TICKS) s = step(s, quiet)
    const p = pnl(s)
    expect(s.settled).toBe(true)
    expect(p.underlying).toBeLessThan(0)
    expect(p.options).toBeGreaterThan(0)
    expect(p.options).toBeGreaterThan(-p.underlying)
    expect(p.net).toBeGreaterThan(0)
    expect(s.cash).toBeCloseTo(s.startCash + p.net, 2)
  })
  it('buy and hold alone is roughly flat in a quiet market', () => {
    let s = createState()
    while (s.tick < TICKS) s = step(s, quiet)
    expect(Math.abs(honestTraderPnl(s))).toBeLessThan(1000)
  })
  it('is reproducible with a seeded rng', () => {
    const run = () => {
      let s = createState()
      const rng = makeRng(7)
      while (s.tick < TICKS) s = step(s, rng)
      return s.index
    }
    expect(run()).toBe(run())
  })
})

describe('option trading rules', () => {
  it('cannot exceed the lot cap or spend more cash than you have', () => {
    const s = createState({ cash: 100 })
    expect(tradeOption(s, 'call', 1)).toBe(s)
    const rich = createState({ cash: 1e9 })
    expect(tradeOption(rich, 'put', 11)).toBe(rich)
  })
  it('selling a call credits premium and shows a loss when the index rises', () => {
    let s = createState()
    s = tradeOption(s, 'call', -1)
    expect(s.cash).toBeGreaterThan(1_000_000)
    expect(pnl(s).options).toBeCloseTo(0)
    s = buyStocks(s, 800_000)
    expect(pnl(s).options).toBeLessThan(0)
    expect(pnl(s).notional).toBeCloseTo(LOT_SIZE * s.index)
  })
})
