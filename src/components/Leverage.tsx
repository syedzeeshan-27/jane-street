import { LeverageWidget } from './LeverageWidget'
import { Callout, Section } from './ui'

export function Leverage() {
  return (
    <Section id="leverage" eyebrow="Step 3" title="Why options blow up (in both directions)">
      <div className="grid gap-6 md:grid-cols-2">
        <LeverageWidget
          rupees={10}
          initialMove={2}
          intro={
            <>
              <b className="text-white">You paid ₹10 for a call in the morning.</b> The index goes up 2%. Your call goes up 400%. Drag the slider to see why a 2% move in the index is a 5x move in the option.
            </>
          }
        />
        <div className="space-y-4">
          <Callout>
            The option only pays the amount the index finishes past the strike. A small move in a 50,000 point index is a huge move relative to a 200 point premium. <b>Small index move, giant option move.</b> SEBI's own example: ₹1 of option premium controls about ₹100 of stock, 100x leverage.
          </Callout>
          <Callout tone="blue">
            Now flip it around. If you can nudge the index by even 1%, and you hold a mountain of options, the options mountain moves 5x. That is the whole trick, and it is what the next sections are about.
          </Callout>
        </div>
      </div>
      <div className="mt-10">
        <h3 className="mb-3 text-xl font-bold">Same thing with ₹100</h3>
        <LeverageWidget
          rupees={100}
          initialMove={-2}
          kindChoice
          intro={<>Same widget, same maths, more money. Pick a call or a put, then move the index against you and watch ₹100 nearly vanish. Then move it with you.</>}
        />
      </div>
    </Section>
  )
}
