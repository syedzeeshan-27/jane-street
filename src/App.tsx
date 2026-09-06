import { GuidedReplay } from './components/GuidedReplay'
import { Hero } from './components/Hero'
import { IndexBuilder } from './components/IndexBuilder'
import { Leverage } from './components/Leverage'
import { LiquidityGap } from './components/LiquidityGap'
import { Nav } from './components/Nav'
import { OptionsBasics } from './components/OptionsBasics'
import { Sandbox } from './components/Sandbox'
import { BiggerPicture, CheatSheet, Comparison, SebiTimeline } from './components/Sections'
import { SEBI_ORDER_URL } from './data/facts'

export default function App() {
  return (
    <div className="min-h-screen bg-ink">
      <Nav />
      <Hero />
      <main className="divide-y divide-line">
        <IndexBuilder />
        <OptionsBasics />
        <Leverage />
        <LiquidityGap />
        <GuidedReplay />
        <Sandbox />
        <Comparison />
        <BiggerPicture />
        <SebiTimeline />
        <CheatSheet />
      </main>
      <footer className="border-t border-line px-5 py-10 text-center text-sm text-mute">
        Built as a classroom explainer. Source for all real figures:{' '}
        <a className="underline" href={SEBI_ORDER_URL} target="_blank" rel="noreferrer">
          SEBI interim order WTM/AN/MRD/MRD-SEC-3/31516/2025-26, 3 July 2025
        </a>
        . Simulation numbers are illustrative only.
      </footer>
    </div>
  )
}
