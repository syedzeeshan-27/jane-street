import { useEffect, useState } from 'react'

export const NAV = [
  ['index', 'Index'],
  ['options', 'Options'],
  ['leverage', 'Leverage'],
  ['pond', 'The gap'],
  ['replay', 'Replay'],
  ['sandbox', 'Play'],
  ['compare', 'Compare'],
  ['pattern', '18 days'],
  ['sebi', 'SEBI'],
  ['cheatsheet', 'Cheat sheet'],
] as const

export function Nav() {
  const [active, setActive] = useState<string>('')
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    NAV.forEach(([id]) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-3 py-2 text-sm">
        <a href="#top" className="mr-3 whitespace-nowrap font-black text-accent">
          Expiry Day
        </a>
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={`whitespace-nowrap rounded-full px-3 py-1 font-semibold transition ${active === id ? 'bg-accent text-ink' : 'text-mute hover:text-white'}`}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}
