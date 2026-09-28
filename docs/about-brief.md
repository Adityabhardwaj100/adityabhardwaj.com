# About Page — Build Brief

## The one-line vision

A slow, cinematic scroll through smoke and firelight that reads like a 1920s Birmingham gangster drama: quiet and certain, a little dangerous. A man explains, without ever raising his voice, why he's the one worth the room.

## Who's reading, and what they should feel

Decision-makers at companies, government ministries and universities who have been oversold AI before. They arrive sceptical. By the end they should feel:

1. **Recognised:** "He knows exactly what's been done to us."
2. **Reassured:** "He's delivered for people like us before."
3. **Intrigued:** "I want one conversation with this man."

The page should never feel like it's *selling*. It should feel like it's *deciding whether you're worth its time*.

## Non-negotiables

- **The copy is final.** Use it word for word, in order. Don't paraphrase, trim or add taglines. The design serves the words.
- **Inspired by, never copied from, Peaky Blinders.** No show logos, stills, character names, the "By order of…" line, the official typeface, or any soundtrack. Evoke the mood only.
- **No weapon imagery beyond the revolver cylinder.** Never a full gun, barrel, bullet, muzzle flash or firing. The cylinder is an object of craftsmanship and mechanism. No "Colt" branding.
- **Readable without motion.** Under `prefers-reduced-motion`, everything shows as a calm, static, well-set column of text with the photo. No pinning, no scrubbing.
- **No new heavyweight dependencies.** Next.js 14 App Router, React 18, CSS Modules, and the `ogl` already in the project. Fonts through `next/font/google`.
- **Fast.** No layout shift. Text must render server-side (for SEO, sharing and screen readers); motion is progressive enhancement on top.

## The world: art direction

**Palette** (define as CSS custom properties in `about.module.css`)

| Token | Role | Value |
|---|---|---|
| `--coal` | Page background | `#0b0b0a` |
| `--soot` | Raised surfaces, smoke | `#1a1917` |
| `--ash` | Body text | `#b9b4a8` |
| `--bone` | Headline text | `#ece6d8` |
| `--brass` | Cylinder, rules, small caps | `#a8834a` |
| `--forge` | The one hot accent: sparks, edge light, focus | `#e2692a` |

Mood grade: desaturated, slightly green-teal shadows, warm highlights. `--forge` is rare. It should feel like a match struck in a dark room.

**Type**

- *Display:* **Instrument Serif**. Tall, condensed and period-feeling. Used huge for the pivotal lines.
- *Body:* **EB Garamond**. Literary and warm, 1.15–1.3rem, line-height ~1.7.
- *Labels:* **EB Garamond small caps**, letter-spaced 0.25em, in `--brass`. Used for chapter marks such as `I · THE BUSINESS`.

**Texture**

- A fixed full-screen film-grain overlay (animated SVG `feTurbulence` or a tiny noise canvas) at low opacity.
- **Embers:** an `ogl` particle layer behind the content. Sparse orange-to-ash particles drift upward. Density and warmth respond to scroll progress per chapter.
- **Smoke:** soft, slow-drifting radial gradients or a low-res noise shader. Used to hide and reveal.

**Motion language**

Slow, weighted and deliberate. Nothing bounces. Eases are `cubic-bezier(0.22, 1, 0.36, 1)` or linear for scrubbed motion. Lines appear the way a man speaks when he knows you're listening: one beat, a pause, the next.

## The scroll: eight chapters

Each chapter is a full-viewport section. Pinned chapters use `position: sticky` inside a tall wrapper, and a small `useScrollProgress(ref)` hook maps 0→1 progress to animation.

### I · The Business: *hook*
> "Most men buy the future. Almost none of them ever see it delivered." / "That's the whole business. Everything else is decoration."

Black screen and a few embers. The first sentence fades in. As the reader scrolls, the second sentence arrives with **"delivered"** last, slightly brighter. Then "That's the whole business." Then, smaller, "Everything else is decoration." A faint `scroll ↓` cue in brass small caps at the bottom, which disappears on first scroll.

### II · The Problem
> "Most companies come to me knowing two things…"

Word-by-word reveal scrubbed to scroll (words go from 15% to 100% opacity). The final sentence splits into three beats, each on its own line and each landing on its own scroll step: **"I build it," / "and then I hand it over," / "and then it's theirs."**

### III · The Ledger: *proof*
> "I've taught applied AI to the Ministry of Finance…"

Styled as an **account ledger**: aged paper tone at very low contrast on dark, thin brass rules, and entries that appear as if being inked. Names get their own lines, set large: Ministry of Finance · Ministry of Skill Development & Entrepreneurship · Gautam Buddha University · RKGIT · Innoworq Infotech · ITCS. The surrounding sentences stay as prose between them.

**INOX gets a pinned moment of its own.** "INOX didn't want a presentation." holds on screen, then "They wanted a machine that worked when nobody was watching.", then "So I built them one, end to end."

### IV · The Cylinder: *origin*
> "I didn't come up through code…" through "…decides they want it."

The signature set piece. The section pins. On the left (or top, on mobile) is a large **SVG revolver cylinder**: six chambers, engraved brass/gunmetal, lit from one side in `--forge`. Each scroll step **rotates it exactly 60°** with a weighted snap (ease-out plus a tiny overshoot) and a synthesized click. The chamber at the top glows, and its line appears beside it:

1. "I didn't come up through code. I came up through management."
2. "I worked IT at COLT in London."
3. "I spent years in sales,"
4. "which is where you learn the only thing worth knowing —"
5. "that a clever man can build anything,"
6. "and it means nothing until somebody in the room decides they want it."

Previous lines dim to 25% rather than disappearing, so the paragraph builds up.

### V · The Man in the Room: *the reveal*
> "So I learned to be the man in the room."

The cylinder locks with a spark. **Cut to black** and hold for a beat of scroll with nothing (and silence, if sound is on). Then `/about-portrait.jpg` **emerges from smoke**: opacity and blur resolve, grain lifts, with a slow push-in (scale 1.08 → 1.0) while pinned and a warm `--forge` edge light from one side through a gradient overlay. Keep the photo black and white. The line lands in huge Instrument Serif over the dark lower third of the photo. This is the peak of the page. Give it room.

### VI · The Work
> "Four things I do: language models, generative media, web, automation…"

Four **calling cards** (cream stock, brass border, small caps) that deal onto the table one per scroll step, slightly rotated and overlapping: **Language Models · Generative Media · Web · Automation**. Then, alone: "The tools change every six months. The work doesn't." Then: "The work is translation — taking something complicated and putting it where a person can use it."

### VII · The Promise
> "Everyone in this industry is promising you the future." / "I'd rather show you…"

Split frame. The first line sits in haze: over-bright, blurred, drifting. Scrolling wipes the haze away, left to right, like smoke clearing, revealing the second line crisp and still underneath. The ember layer calms here.

### VIII · The Room: *close*
> "One conversation and you'll know whether I'm worth the room."

The smoke has fully cleared, leaving one warm light. The line is centred. Under it, one understated button in brass outline, **"Book the conversation"**, linking to `/book`. Optional: a small, faded crop of the hat brim from the portrait.

**Callback:** the cylinder reappears small beside the button and completes one final 360° turn, *six chambers for six months*, then rests.

## Sound (off by default)

A small brass toggle, fixed bottom-right, labelled `♪ sound`. Everything is synthesized with the **Web Audio API**. No audio files and no licensing. The AudioContext is created only on the user's click.

| Moment | Sound |
|---|---|
| Base bed | Low detuned drone (two sawtooth or triangle oscillators around 55 Hz, low-pass ~400 Hz, slow LFO on the filter). Volume follows scroll. |
| Cylinder step | Short mechanical click: a noise burst through a band-pass filter, plus a tiny low thump. |
| Chapter V cut to black | **Total silence.** The drone fades out over ~300 ms. |
| Photo emerges | One deep, long, soft low note with reverb (a convolver with a generated impulse). |
| Chapter VIII | The drone returns warmer, resolving upward a fifth. |

Design the audio module so a licensed track in `public/audio/` can later be layered underneath as a bed, with the synthesized cues on top.

## Responsive and accessibility

- **Mobile first:** the cylinder stacks above its text, cards deal into a single column, and the ledger stays one column. 16px minimum side gutters and no horizontal scroll.
- **Semantics:** one `<h1>` (visually hidden: "About Aditya Bhardwaj"), each chapter a `<section>` with an `aria-label`, and the full copy present in the DOM from first render.
- The portrait gets real alt text: "Aditya Bhardwaj in an overcoat and hat, tipping the brim."
- Decorative canvases and the SVG cylinder are `aria-hidden`.
- The sound toggle is a real `<button>` with `aria-pressed`.
- Contrast: body text on coal meets WCAG AA.
- Reduced motion: no pinning, no scrubbing, no particles, and sound stays optional.

## Build structure

```
app/about/
  page.tsx                 # server component: copy + structure
  about.module.css         # tokens, layout, chapters
  _components/
    ScrollChapter.tsx      # sticky wrapper + progress context
    useScrollProgress.ts   # rAF-throttled 0→1 per section
    WordReveal.tsx         # word-by-word scrubbed text
    Cylinder.tsx           # SVG revolver cylinder, rotates by step
    PortraitReveal.tsx     # smoke → photo, push-in, edge light
    CallingCards.tsx       # the four services
    Embers.tsx             # ogl particle layer
    Grain.tsx              # film-grain overlay
    SoundToggle.tsx        # UI for the audio engine
  _lib/
    audio.ts               # Web Audio drone, clicks, cues
```

## Definition of done

- Scrolling top to bottom feels like one continuous scene, not eight slides.
- The cylinder turns exactly one chamber per step, and the reveal at V produces an audible gasp of silence.
- Every word of the copy is present, unedited and in order.
- 60fps on a mid-range laptop; embers degrade gracefully on low-power devices.
- `npm run typecheck` and `npm run build` pass.
- Reduced-motion mode reads beautifully on its own.
