# Mobile Controls, Sound Unlock, and Screenshot — Design

## Goal

Make Chicken Run playable on mobile phones with on-screen PlayStation-style
controls, ensure sound works despite mobile autoplay restrictions, and add a
screenshot to the README and the game page for visual appeal.

## Scope

- `index.html` — responsive canvas scaling, hero screenshot, touch control
  markup/CSS.
- `sketch.js` — touch event handlers wired into existing input state
  (`isLeft`, `isRight`, `isFlying`, `charSpeed`), audio unlock on first touch,
  touch-only restart button.
- `README.md` — screenshot embed.
- `assets/screenshot.png` — new captured screenshot.

No changes to game physics, level layout, or desktop keyboard behavior.

## 1. Responsive canvas

Canvas stays fixed at 1024×576 internally (p5 `createCanvas`). CSS scales the
`<canvas>` element to fit viewport width while preserving aspect ratio:

```css
canvas { max-width: 100vw; height: auto; display: block; margin: 0 auto; }
```

Touch control overlay is positioned with `position: fixed` relative to the
viewport (not the canvas element), so it stays usable at any scale factor.

## 2. Touch detection

Controls render only on touch-capable devices:

```js
var isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
```

If true, inject the control overlay DOM (built in JS, appended to `body`) and
show it; desktop/mouse-only users never see it and keyboard handling is
untouched.

## 3. Control layout (PS-style)

- **Left cluster** (bottom-left, fixed): two semi-transparent circular
  buttons, left-arrow and right-arrow, side by side (d-pad reduced to the
  game's 2 actual movement axes — no up/down needed).
- **Right cluster** (bottom-right, fixed): 3 round buttons in a diagonal
  triangle arrangement resembling PS face buttons:
  - **Jump** (bottom) — tap → same effect as spacebar (only fires if
    `!isFalling && !isPlummeting && !isFlying`, matches existing
    `keyPressed` guard).
  - **Fly** (top) — hold → sets `isFlying = true` on touchstart, `false` on
    touchend (mirrors `F` key hold behavior, including `flyingSound`
    start/stop).
  - **Speed** (left of Jump) — hold → `charSpeed = 15` on touchstart, `10` on
    touchend (mirrors `S` key hold).
- All buttons use `touchstart`/`touchend` (with `preventDefault()` to avoid
  ghost clicks/scrolling) and call the *same* state mutations the existing
  `keyPressed`/`keyReleased` functions perform — no parallel game-logic path.
- **Restart button**: a text button (`"Tap to Restart"`), absolutely
  positioned center screen, hidden by default (`display:none`), shown only
  when `isGameOver || levelComplete` (checked each `draw()` frame or via the
  existing state transitions), calling the same reset path as the `R` key.

## 4. Audio unlock

Mobile browsers require a user gesture before audio can play. On the very
first `touchstart` anywhere in the document, call:

```js
if (getAudioContext().state !== 'running') getAudioContext().resume();
```

This listener is registered once (`{ once: true }`) and fires before any
control-specific touch handler, so `themeSound.loop()` (already called in
`startGame()`) becomes audible immediately after.

## 5. Screenshot

Captured by launching a local server, opening the game in a browser, driving
the chicken into an active mid-game frame (near corn/enemy, mid-jump), and
screenshotting the canvas. Saved to `assets/screenshot.png`.

- **README.md**: inserted under the title/description, above "## Play it".
- **index.html**: inserted as a small hero image above the `<canvas>`
  (doesn't overlap play area or touch controls, purely decorative header).

## Out of scope

- Portrait-mode-specific layout (game assumes landscape-ish wide view;
  scaling handles small screens but no separate portrait redesign).
- Multi-touch gesture conflicts beyond basic non-overlapping button zones.
- Changing game balance/physics for touch input.
