import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { formatRupees } from '../sim/market'

export function Section({ id, eyebrow, title, children, className = '' }: { id: string; eyebrow?: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-6xl px-5 py-16 md:py-24 ${className}`}>
      {eyebrow && <div className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">{eyebrow}</div>}
      <h2 className="mb-8 text-3xl font-black leading-tight md:text-5xl">{title}</h2>
      {children}
    </section>
  )
}

export function Big({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'up' | 'down' | 'neutral' | 'accent'; className?: string }) {
  const c = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : tone === 'accent' ? 'text-accent' : 'text-white'
  return <div className={`num text-4xl font-black md:text-6xl ${c} ${className}`}>{children}</div>
}

/** Animated number that eases toward its target. */
export function Counter({ value, format = (v: number) => Math.round(v).toLocaleString('en-IN'), className = '' }: { value: number; format?: (v: number) => string; className?: string }) {
  const spring = useSpring(value, { stiffness: 120, damping: 20 })
  useEffect(() => {
    spring.set(value)
  }, [value, spring])
  const text = useTransform(spring, (v) => format(v))
  return <motion.span className={`num ${className}`}>{text}</motion.span>
}

export function Money({ value, className = '' }: { value: number; className?: string }) {
  const tone = value > 0.5 ? 'text-up' : value < -0.5 ? 'text-down' : 'text-white'
  return <Counter value={value} format={(v) => (v > 0.5 ? '+' : '') + formatRupees(v)} className={`${tone} ${className}`} />
}

export function Arrow({ dir, size = 64 }: { dir: 'up' | 'down' | 'flat'; size?: number }) {
  const color = dir === 'up' ? 'var(--color-up)' : dir === 'down' ? 'var(--color-down)' : 'var(--color-mute)'
  return (
    <motion.svg
      key={dir}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: dir === 'up' ? [0, -6, 0] : dir === 'down' ? [0, 6, 0] : 0 }}
      transition={{ duration: 0.6, y: { repeat: Infinity, duration: 1.2 } }}
    >
      {dir === 'flat' ? (
        <path d="M4 12h16" stroke={color} strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d={dir === 'up' ? 'M12 20V4M5 11l7-7 7 7' : 'M12 4v16M5 13l7 7 7-7'} stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}
    </motion.svg>
  )
}

export function Callout({ children, tone = 'accent' }: { children: ReactNode; tone?: 'accent' | 'down' | 'blue' }) {
  const b = tone === 'accent' ? 'border-accent/60 bg-accent/10' : tone === 'down' ? 'border-down/60 bg-down/10' : 'border-blue/60 bg-blue/10'
  return <div className={`rounded-xl border p-4 text-base leading-relaxed md:text-lg ${b}`}>{children}</div>
}

export function Slider({ label, value, min, max, step = 1, onChange, display }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; display?: string }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-mute">{label}</span>
        <span className="num font-bold">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}
