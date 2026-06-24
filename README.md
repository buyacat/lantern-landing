# Lantern Landing

Marketing site for [Lantern](https://withlantern.ai) — a Chrome extension that turns any page you read into a language lesson.

## Stack

Plain HTML/CSS/JS. No framework, no bundler, no dependencies. All product UI (browser mock, word cards, chat panel) is live DOM built in JavaScript — no screenshots.

## Files

| File | Role |
|---|---|
| `index.html` | Entire page markup + inline styles for hero phase transitions |
| `lantern-v3.css` | All layout and animation |
| `lantern-v3.js` | Core engine: scroll → phase transitions, shared dictionary, WordShelf |
| `lantern-hero-words.js` | Hero word-card tap interactions |
| `lantern-everywhere.js` | "Everywhere" section — site wall split animation |
| `lantern-morph.js` | FLIP ribbon→pill morph |
| `lantern-v3-morph-feat.js` | Feature card morphing on the install screen |
| `lantern-scrub.js` | Desktop bottom deck (scrubber + play button) |
| `lantern-deck.js` | Install screen card deck |
| `lantern-cta-charge.js` | CTA install screen charge animation |
| `lantern-light.js` | Background hue shift |
| `lantern-v3-close.js` | Hero browser close button |

## Build

```bash
./build.sh
```

Copies all site files into `dist/`. No compilation step — the output is identical to the source.

## Dev

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server
```

## `screenshots/`

Development-only artifacts (before/after comparisons, layout probes). Not referenced by the page and not included in the build.
