# Bunk Meter: Project Brief

## 1. What we are building

A polished Wrench Wise website for PC and mobile. A college student enters classes attended and total classes so far. The site shows one big number: green for "You can skip 4", red for "Attend the next 7", so they keep 75%. Their numbers are saved on their own device, nowhere else.

**Who it is for:** college students, most of whom have never written code.

**Already done and tested for you:** the attendance maths engine, all the words on the site (`js/copy.js`) and the settings (`config.js`). Your job is everything the visitor sees and touches.

**Time target:** 1 hour in total. Keep it simple and finish it properly.

When there is a trade-off, follow this order:
1. Every number is exactly right.
2. It looks professional and feels instant on a phone.
3. The big number is clear in one glance.
4. It stays smooth on a mid-range Android phone.
5. The maths section teaches clearly.
6. The Wrench Wise CTA works in one tap.
7. It is easy to upgrade (subject-wise tracking is the student challenge).
8. Everything else.

---

## 2. Hard rules

1. **Code.** Plain HTML, CSS and JavaScript (ES modules). No frameworks, libraries, CDNs, npm packages or web fonts. The only image files are the logo, the link preview image and app icons. Draw everything else with inline SVG and CSS.
2. **Locked files.** Never edit `js/engine/`, `tools/`, `vercel.json` or `package.json`. Change `js/copy.js` and `config.js` only if I ask, except `siteUrl` in Phase 4. At the start of every phase, run `node tools/verify.mjs`. It must end with `RESULT: ALL PASS`. If you think a locked file is wrong, stop and tell me.
3. **Nothing leaves the device.** No backend, database, API calls, accounts or forms. No GA4, Meta Pixel or any other outside script. Normal links to wrench-wise.com and WhatsApp are fine.
4. **One source for every number.** Every answer, percentage and formula number on screen comes straight from `calc()` or `project()`. Never do attendance maths anywhere else, not even a percentage. The share text uses only the big number and the target, never the visitor's raw counts.
5. **Inputs.** Exactly `<input id="attended" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="4">` and the same for `id="total"`, each with a real `<label for>`. Do not use `type="number"`. Text at least 16px so phones do not zoom in. No `<form>`.
6. **Privacy lock.** Put this as the first tag in `<head>`, after the charset:
   `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; manifest-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">`
   This means no inline scripts, no `<style>` tags, no `style=""` attributes and no `onclick=""` in HTML. Setting `element.style` from JavaScript is fine.
7. **Storage.** `localStorage` may hold only `bm-data` (written with `toSaved()`, read back with `readSaved()`) and `bm-theme`. `sessionStorage` may hold only `bm-intro-seen`. Use them only in `js/store.js` and `js/theme-init.js`, wrapped in try and catch. The site must work when storage is blocked, and then show `save.blocked`.
8. **Tone.** Friendly and honest. Never tell people bunking is a good idea, never promise a job or a result. Never use these where a user can see them: stupid, dumb, loser, guarantee, placement, salary, lakh, "get hired", "seats left", or any countdown to buy.
9. **Words.** All text comes from `js/copy.js` through `t()`. Program names always use the full name from `config.js`. No emojis. No em dashes.
10. **Safety.** Never use `innerHTML` or `insertAdjacentHTML`. Use `textContent`. No `console` output.
11. **No overlap.** Nothing overlaps, clips or scrolls sideways at 320, 360, 390, 768, 1280 or 1440 px wide. A 5-digit answer like "15,000" must still fit.
12. **No placeholder look.** No grey boxes, lorem ipsum, stock icons or unfinished sections. Remove any debug panel before Phase 4 ends.
13. **Colour is never the only signal.** Green, amber and red always come with words ("You can skip", "Don't skip", "Attend the next").

---

## 3. Keep it easy to upgrade

- The engine has no page code. Pages call `calc()`, `project()`, `logClass()`, `toSaved()` and `readSaved()`.
- Saved data is already a list of subjects: `{ v: 1, target, subjects: [{ id, name, attended, total }] }`. Version 1 uses one subject with `id: "overall"`. Subject-wise tracking (the student challenge) then needs no change to saved data or maths.
- The meter is one render function, `renderMeter(container, result)`, that works for any subject. Do not hard-code it to the page.
- All words are in `js/copy.js`. All settings are in `config.js`. Each `config.features` switch set to `false` hides that feature with no errors.
- Colours, spacing and timing live only in `styles/tokens.css`.

---

## 4. Tech setup and file structure

ES modules need a local server. Use `npx --yes serve .` from the project folder, or Antigravity's built-in preview. Vercel needs no build command. Set up git in Phase 1 and commit at the end of every phase.

```
bunk-meter/
  index.html
  config.js            given
  vercel.json          given, LOCKED
  package.json         given, LOCKED
  manifest.json
  og-image.png         made in Phase 4
  assets/logo.png      I add this. If missing, show "Wrench Wise" as text
  assets/icon.svg      gauge icon, drawn in code
  js/
    engine/bunk.js     LOCKED
    copy.js            given
    theme-init.js      plain script in head. Sets theme and intro class before first paint
    main.js            starts everything, holds the current numbers
    store.js           safe storage
    links.js           program, WhatsApp and share links with UTM
    input-ui.js        two inputs, steppers, target pills, examples, start over, errors
    meter-ui.js        renderMeter(): gauge, big number, colour, lines under it
    whatif-ui.js       Skip / Attend toggle and slider
    today-ui.js        I attended, I skipped, Undo
    sections-ui.js     share, how it works, your turn, note, CTA, footer
    motion.js          loader, number tween, scroll reveal, reduced motion check
    selftest.js        ?test=1
  styles/
    tokens.css  base.css  components.css  motion.css
  tools/verify.mjs     LOCKED
```

**The engine**
- `calc(attended, total, target)` takes what the visitor typed (text is fine). It returns either `{ ok: false, error, field }` or:
  `{ ok: true, attended, total, missed, target, status, skip, need, big, now, after, drop, formula }`.
- `status`: `"safe"` (can skip at least 1), `"edge"` (exactly at the line, skip 0) or `"below"`.
- `big` is the big number: `skip` when safe or edge, `need` when below.
- `now`, `after` and `drop` are `{ attended, total, tenths, text, meets }`. `text` is the percentage already rounded down, like `"82.5"`. `after` is where they land after skipping `skip` or attending `need`. `drop` is one skip past the limit (null when below).
- `formula`: `{ top, bottom, rounded }` for the How it works section. The answer is `top ÷ bottom`, rounded `"down"` or `"up"`.
- `error` is one of `ERROR_CODES`, and its words are in `copy.errors`. `field` is `"attended"`, `"total"` or `"target"`.
- `project(attended, total, target, { skip, attend })` returns a snapshot for the What if slider.
- `logClass(attended, total, present)` returns the new `{ attended, total }`, or `null` at the 5,000 class limit.

---

## 5. Page layout

**Laptop (1024px and up):** centred, max width 1120px. The hero is two columns. Left: heading, then the input card. Right: the meter card, sticky while the left side scrolls. Below them, What if and Today side by side, then the other sections.

**Phone:** one column: short heading, input card, meter card, What if, Today, then the other sections. The meter card sits right under the inputs so the answer is visible while typing.

**Order of sections:** header, hero (inputs and meter), What if and Today, share, how it works, your turn, note, CTA, footer.

---

## 6. Features

**A. Loader.** Shown on the first visit of a session. The logo, then a gauge whose needle sweeps from 0 to the 75% line and settles with a small bounce, with a thin brand gradient bar. It ends by `config.loaderMs` (never longer), fades in 250 ms, and the hero rises 12px into place. If JavaScript fails, a CSS animation still removes it by 2 seconds. No loader under reduced motion.

**B. Input card.**
- The two inputs, each with large minus and plus steppers. Holding a stepper repeats every `config.holdRepeatMs`. Minus never goes below 0. Plus on attended never passes total (it raises total too).
- Target pills from `config.targets` (75 default) under `input.target`.
- Answer updates live on every input, no button. Errors show under the right field from `copy.errors`, with a red border, and the meter goes back to its idle state.
- Try an example: two chips, Doing well (`config.examples.safe`) and Falling behind (`config.examples.danger`). Start over clears everything.

**C. Meter card.** Idle state first: a calm grey gauge with `meter.idle` and `meter.idleSub`. Then:
- A half-circle SVG gauge: the arc fills to `now` (via `stroke-dashoffset`), the needle rotates to `now`, and a tick marks the target with `meter.target`.
- **The big number** in the middle, at least 88px on laptop and 64px on phone, weight 800, tabular numbers.
  - safe: green, `meter.safeLabel` above, the number, `meter.safeUnit` below.
  - edge: amber, `meter.edgeTitle` as the big text and `meter.edgeSub` below.
  - below: red, `meter.dangerLabel` above, the number, `meter.dangerUnit` below.
  Use the "One" versions when the number is 1.
- Lines under it: `meter.now`, then `afterSkip` and `dropLine` (safe), or `afterAttend` (below), and `meter.missed`.
- The card background takes a very soft tint of the status colour.

**D. What if** (`features.whatIf`). A Skip / Attend toggle and a slider from 0 to `config.whatIfMax`. Shows `whatIf.line` with `project()`, and an Above or Below badge. Starts at the big number so it opens on the edge case. Hidden in the idle state.

**E. Today** (`features.todayButtons`). I attended and I skipped buttons use `logClass()`, update the inputs and the meter, and show `today.done`. Undo reverses the last tap (one step only). Show `today.full` when `logClass()` returns null.

**F. Save on device** (`features.saveOnDevice`). Save after every valid change. On load, restore with `readSaved()` and show the answer straight away. Show `save.on` with a small lock icon, and a `save.clear` link that wipes `bm-data` and resets the page.

**G. Share** (`features.share`). Text from `share.safe`, `share.edge` or `share.danger` plus `config.siteUrl` with UTM. Use `navigator.share` when it exists, otherwise open WhatsApp with the text. Hidden in the idle state.

**H. How it works** (`features.howItWorks`). `how.intro`, then two cards: skip formula and need formula, with the visitor's live numbers in `how.yours` from `formula` (answer is `big`). The card that matches the current status is highlighted. A third card, Loop or formula?, fills `how.loop` with `checks` = `big + 1`. Then `how.rounding`.

**I. Your turn** (`features.yourTurn`). A card with `yourTurn.heading`, `body` and three numbered hints. This is the challenge for students.

**J. Note and CTA.** `note` in small text. Then a CTA card with `cta.title`, `cta.body` and two buttons: the program link (`program.page`, or `website`, with UTM from `config.utm`) and WhatsApp (hidden if `salesWhatsApp` is empty). No forms or gates. Links open in a new tab with `rel="noopener noreferrer"`.

**K. Theme.** Light and dark, first visit follows the device, a toggle saves `bm-theme`.

**Nice to have, only if time allows:** `manifest.json` install support.

---

## 7. Visual style: matched to wrench-wise.com

Emerald as the main colour, teal and cyan as accents, gray text, white cards and soft emerald-to-cyan gradients. Every colour is a CSS variable in `styles/tokens.css`.

| Token | Light (default) | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F172A` |
| `--bg-grad` | `linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 45%, #ECFEFF 100%)` | `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` |
| `--surface` | `#FFFFFF` | `#1E293B` |
| `--surface-2` | `#F3F4F6` | `#334155` |
| `--border` | `#E5E7EB` | `#334155` |
| `--text` | `#111827` | `#F1F5F9` |
| `--text-2` | `#374151` | `#CBD5E1` |
| `--muted` | `#6B7280` | `#94A3B8` |
| `--brand` | `#059669` | `#10B981` |
| `--brand-strong` | `#047857` | `#34D399` |
| `--brand-soft` | `#D1FAE5` | `rgba(16,185,129,0.15)` |
| `--accent` | `#0891B2` | `#22D3EE` |
| `--safe` | `#059669` | `#34D399` |
| `--edge` | `#B45309` | `#FBBF24` |
| `--danger` | `#DC2626` | `#F87171` |

**Brand gradient:** `--brand-grad: linear-gradient(90deg, #059669, #0D9488, #06B6D4)`. Use it for primary buttons, the bar under the header, the loader bar and the CTA card's top edge.

**Fonts:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Headings weight 800, letter spacing -0.01em. Numbers use `font-variant-numeric: tabular-nums`. The formulas use `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

**Shapes:** buttons, pills and chips 999px. Cards 16px. Inputs 12px.

**Shadows** (in dark, same shapes with `rgba(0,0,0,0.40)`):
- `--shadow-sm: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)`
- `--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)`
- `--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)`

**Hover effects** (only inside `@media (hover: hover)`)
- Buttons lift 2px with `--shadow-md`. The primary button also slides its gradient.
- Cards lift 3px with `--shadow-lg` and a soft brand border. The meter card glows softly in its status colour.
- Pills, chips and steppers fill with `--brand-soft`.
- Formula cards show their live line in `--brand`.
- Links get an underline that grows from the left.

**Micro-interactions**
- Press on any button, pill, chip or stepper: scale to 0.97.
- Input focus: border glows in `--brand`. Steppers make the number bump up or down 4px.
- Big number: counts to its new value over `config.countMs` (the final frame shows exactly `big`). On a status change, the colour cross-fades and the number pops once (scale 1.06 then 1).
- Gauge: the arc and needle glide to the new percentage with a small overshoot.
- Crossing the line from red to green: a short ring pulse around the gauge, once.
- Target pills: the selected background slides to the new pill.
- What if: the projected percentage and badge update as the slider moves, and the slider thumb grows while dragged.
- Today buttons: a +1 floats up from the matching input and fades.
- Share: a tick replaces the icon for 1.5 seconds when the link is copied.
- Theme toggle: sun and moon rotate and swap.
- Scroll reveal: lower sections fade and rise 16px, once, with `IntersectionObserver`.

**Motion rules**
- Animate only `transform`, `opacity`, colour and SVG `stroke-dashoffset`.
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`. `--ease: cubic-bezier(0.4, 0, 0.2, 1)`. Most effects 150 to 250 ms.
- A new value replaces any running animation. Typing fast never queues animations.
- `prefers-reduced-motion`: no loader, tween, pop, pulse, float or reveal. Plain state changes only.

**Access:** full keyboard use, visible focus rings (2px `--accent`), tap targets at least 44px, text contrast at least 4.5 to 1. One polite `aria-live` region announces the big answer in words (for example "You can skip 4 classes") after typing pauses for 500 ms.

**Meta:** `theme-color` `#FFFFFF` and `#0F172A` by media query. Title: "Bunk Meter | Wrench Wise". Add a description and `og:` tags.

---

## 8. Words

Use `js/copy.js` as it is. Do not add other visible text without asking me.

---

## 9. Analytics

None, to keep the page lock strict and the build to 1 hour. The UTM tags on links to wrench-wise.com show visits from this project in the main site's reports.

---

## 10. Correctness

**`node tools/verify.mjs`** checks every answer from 1 to 300 classes at every target from 50% to 95% against a slow class-by-class count, the examples, bad input, saved data, the locked files and the privacy rules across all your files. It must pass at the start of every phase and before deploy.

**`?test=1`** opens a self-test page in `js/selftest.js`, listing PASS or FAIL per line, using the real page code:
1. Doing well (33 of 40) shows green "You can skip 4 classes", "You are at 82.5%", "After 4 skips: 75%" and "One more skip and you drop to 73.3%."
2. Falling behind (17 of 25) shows red "Attend the next 7 classes", "You are at 68%" and "After 7 classes in a row: 75%".
3. 30 of 40 shows amber "Don't skip the next class."
4. Target 85 with 33 of 40 shows red "Attend the next 7 classes" and "After 7 classes in a row: 85.1%".
5. Typing 41 in attended with 40 in total shows `errors.moreThanTotal` and the idle meter.
6. What if, Skip, 5, with 33 of 40 shows 73.3% and the Below badge.
7. I skipped on 33 of 40 gives 33 of 41 and "You can skip 3 classes". Undo goes back to 33 of 40.
8. After a reload, the numbers come back from `bm-data`. Clear my data removes it.
9. `fetch("https://wrench-wise.com/", { mode: "no-cors" })` is refused by the privacy lock.
10. Storage holds only allowed keys, and `document.documentElement.scrollWidth` is not larger than the window width.

---

## 11. Phases

Stop after every phase, give me the Phase Report, and wait for me to say "Go".

**Phase 1: Shell and loader (10 min).** Git, `index.html` with the privacy lock, tokens, themes, header, footer, loader, hero layout on laptop and phone, `store.js`, `theme-init.js`.

**Phase 2: Inputs and the big number (20 min).** Input card with steppers, target pills, examples and errors. Meter card with gauge, big number, colours and lines, with all their micro-interactions. Saving on device.

**Phase 3: The rest (15 min).** What if, Today, share, how it works, your turn, note, CTA, hover effects, scroll reveal.

**Phase 4: Finish and deploy (15 min).**
1. Build `?test=1`. Fix everything until it passes. Check all widths in rule 11, both themes and reduced motion.
2. Make `og-image.png` (1200 x 630, Wrench Wise colours, the gauge and "You can skip 4").
3. Help me push the folder to GitHub. I will give you my empty repository URL.
4. Deploy on Vercel as a static site with no build command.
5. Set `config.siteUrl`, `og:url` and `og:image` to the live address, then redeploy.
6. Give click-by-click steps for anything I must do myself.
7. Confirm the live site works on a phone-sized screen and that `?test=1` passes live.
8. Tag the release `v1.0.0`, push the tag and give me the live link.

---

## 12. Phase Report format

- **What I built** (3 to 5 bullets)
- **How to check it** (click steps)
- **Screenshots** (phone and laptop)
- **verify.mjs result**
- **Not working or cut,** explained in plain words
- **Time used** against the target

---

## 13. If something keeps breaking

- If the same bug survives two fix attempts, stop. Explain it in plain words and give me options. Do not keep looping.
- If I say "Park it", move that feature to a "Parked" list in the Phase Report and continue.
- If time runs short, park in this order:
  1. `manifest.json` install support
  2. Share
  3. Scroll reveal
  4. Today buttons
  5. What if

**Never park:**
- Every rule in Section 2
- The loader, hover effects and core micro-interactions (number tween, gauge glide, colour change, steppers)
- The inputs, target pills, examples, meter card and saving on device
- How it works and Your turn (they make this a student project)
- Phone and laptop layouts, light and dark themes
- Wrench Wise branding and the CTA
- `verify.mjs`, `?test=1` and deployment
