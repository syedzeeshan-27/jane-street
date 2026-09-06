import { motion } from 'framer-motion'
import { pattern, SEBI_ORDER_URL } from '../data/facts'

export function Hero() {
  return (
    <header id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,185,66,0.18),transparent_60%)]" />
      <div className="mx-auto max-w-6xl px-5 pb-12 pt-16 md:pb-20 md:pt-28">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-3 text-sm font-bold uppercase tracking-widest text-accent">An interactive explainer</div>
          <h1 className="max-w-4xl text-4xl font-black leading-[1.05] md:text-7xl">
            How one firm allegedly moved India's biggest bank index and made <span className="text-accent">₹{pattern.impoundedCrore.toLocaleString('en-IN')} crore</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-mute md:text-xl">
            No finance background needed. Ten minutes, six steps, and you will do the trade yourself with pretend money. By the end you can explain it to a friend.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#index" className="btn btn-accent text-lg">
              Start from zero
            </a>
            <a href="#replay" className="btn btn-ghost text-lg">
              Skip to the trade
            </a>
          </div>
        </motion.div>
        <div className="mt-10 rounded-xl border border-down/50 bg-down/10 p-4 text-sm text-mute md:text-base">
          <b className="text-white">Disclaimer.</b> Everything here is a simplified teaching simulation of the strategy described in{' '}
          <a className="underline" href={SEBI_ORDER_URL} target="_blank" rel="noreferrer">
            SEBI's interim order of 3 July 2025
          </a>
          . It is not a reconstruction of real trades, not financial advice, and not a statement that anyone is guilty. The order is interim and under appeal. The numbers in the games are made up and tiny; the numbers in the fact boxes are SEBI's.
        </div>
      </div>
    </header>
  )
}
