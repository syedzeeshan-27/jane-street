# Expiry Day (Jane Street Bank Nifty explainer)

Vite + React + TS site in `src/`, pptxgenjs deck in `deck/`. `npm run dev`, `npm test`, `npm run deck`.

## Lessons learned (do not repeat)
- Do not add global CSS like `.recharts-surface { max-width: 100% }`: it collapses Recharts SVGs to 0px width. Fix chart overflow with `min-w-0` on grid children and a fixed-height wrapper instead.
- Recharts ReferenceLine labels with `position: 'right'` get clipped on narrow screens; use `insideBottomRight`.
- Writing several files in one Bash heredoc chain fails silently on this Windows Git Bash (unmatched quote parse error); use the Write tool per file.
- Vitest here swallows console.log; write probe output to a file instead.
- The pptx skill's `soffice.py` cannot run on Windows (AF_UNIX). Render slides with PowerPoint COM: `$app = New-Object -ComObject PowerPoint.Application; $pres.Export(dir, "PNG", 1600, 900)`.
