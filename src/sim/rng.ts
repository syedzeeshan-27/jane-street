/** Small seeded PRNG (mulberry32) so the guided replay is reproducible. */
export type Rng = () => number

export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Approximately normal(0,1) via sum of uniforms. */
export function gauss(rng: Rng): number {
  let s = 0
  for (let i = 0; i < 6; i++) s += rng()
  return (s - 3) * Math.sqrt(2)
}
