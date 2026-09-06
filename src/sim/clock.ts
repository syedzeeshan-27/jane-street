/** Trading day = 75 ticks of 5 minutes, 09:15 to 15:30. */
export const TICKS = 75
export const TICK_MINUTES = 5

export function tickToTime(tick: number): string {
  const mins = 9 * 60 + 15 + tick * TICK_MINUTES
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function timeToTick(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return Math.round((h * 60 + m - (9 * 60 + 15)) / TICK_MINUTES)
}
