# Expiry Day

An interactive explainer of the strategy SEBI alleged Jane Street used on Bank Nifty expiry days, plus a 28 slide deck.

Everything is a simplified teaching simulation. Real figures come from SEBI's interim order of 3 July 2025, which is under appeal. Nothing here is a finding of guilt or financial advice.

## Run the website

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Tests (simulation invariants)

```bash
npm test
```

## Build for hosting

```bash
npm run build
```

`dist/` is a static site. Drop it on GitHub Pages, Netlify or Vercel. `base` is set to `./` so it works under any sub-path.

Quick GitHub Pages recipe: push this repo, then in the repo settings enable Pages from a GitHub Action, or install `gh-pages` and run `npx gh-pages -d dist`.

## Rebuild the deck

```bash
npm run deck
```

Writes `deck/Jane_Street_Expiry_Day.pptx` and copies it to your Downloads folder. The script fails if it finds any en or em dash or if the slide count is not 28.

## Layout

- `src/sim/` the market model: price impact, option pricing, P&L, clock. Pure TypeScript, no React.
- `src/store/game.ts` a Zustand store factory so the guided replay and the sandbox each get their own market.
- `src/components/` one component per section of the page.
- `src/data/facts.ts` every real number with a paragraph reference to the SEBI order.
- `deck/` pptxgenjs generator and the shared data file.
