# Mobile Controls, Sound Unlock, and Screenshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Chicken Run playable on mobile phones with PlayStation-style on-screen touch controls, working audio despite mobile autoplay restrictions, and a screenshot embedded in the README and the game page.

**Architecture:** Extract the existing keyboard action logic (jump/fly/speed/restart) in `sketch.js` into named functions so touch handlers can call the exact same code paths. Add a hidden-by-default touch control overlay to `index.html`, shown only on touch-capable devices, positioned with fixed CSS over a responsively-scaled canvas. Unlock the p5 AudioContext on first touch. Capture a real gameplay screenshot via browser automation and embed it in `README.md` and `index.html`.

**Tech Stack:** Vanilla JS, p5.js + p5.sound (no bundler, no build step, no package.json). Static files served directly or via `npx http-server`.

## Global Constraints

- No changes to game physics, level layout, enemy behavior, or desktop keyboard controls — touch handlers must reuse the exact same state mutations as the existing keyboard handlers, not reimplement them.
- Canvas internal resolution stays `1024x576` (`createCanvas(1024, 576)` in `sketch.js` setup()) — only CSS scaling changes, not the p5 canvas size.
- This repo has **no automated test framework** (static JS/p5.js game, no package.json, no test runner). Every task's "test" step is a manual browser verification using the `claude-in-chrome` MCP tools (or equivalent local browser check) — drive the actual page, observe behavior/console, and confirm expected result. This replaces unit tests for this plan.
- Touch controls must only appear on touch-capable devices (`'ontouchstart' in window || navigator.maxTouchPoints > 0`); desktop/mouse users see no overlay and keyboard behavior is unchanged.
- Serve the game locally for all verification via `npx http-server . -p 8080` run from `/Users/roberto/Desktop/GAME FINAL`.

---

### Task 1: Extract shared input-action functions in sketch.js

**Files:**
- Modify: `sketch.js:1117-1166` (`keyPressed` and `keyReleased`)

**Interfaces:**
- Produces (top-level functions, no params, mutate existing globals — consumed by Task 3's touch handlers):
  - `doJump()` — jump if not falling/plummeting/flying, plays `jumpSound`
  - `startFlying()` / `stopFlying()` — begin/end flying, handles `flyingSound`
  - `startSpeedBoost()` / `stopSpeedBoost()` — set `charSpeed` 15/10
  - `doRestart()` — reset lives/flags and call `restartGame()`

- [ ] **Step 1: Replace keyPressed/keyReleased with extracted functions + slim handlers**

Replace `sketch.js:1117-1166`:

```js
// Handle key presses
function keyPressed() {
    if ((isGameOver || levelComplete) && (key == 'r' || key == 'R')) {
        lives = 3;
        isGameOver = false;
        levelComplete = false;
        restartGame();
        return;
    }
    
    if (isGameOver || levelComplete || isPlummeting) return;

    if (keyCode === LEFT_ARROW) isLeft = true;
    else if (keyCode === RIGHT_ARROW) isRight = true;
    else if (keyCode === UP_ARROW || key === 'w' || key === 'W' || keyCode === 32) {
        if (!isFalling && !isPlummeting && !isFlying) {
            isFalling = true;
            gameCharWorldY -= jumpStrength;
            jumpSound.play();
        }
    } else if (key === 's' || key === 'S') {
        charSpeed = 15; // Speed boost!
    } else if (key === 'f' || key === 'F') {
        // Start flying if not plummeting or already flying
        if (!isPlummeting && !isFlying) {
            isFlying = true;
            wingFlap = random(0, 100); // Randomize flap start
            if (flyingSound && flyingSound.isLoaded() && !flyingSound.isPlaying()) {
                flyingSound.loop();
            }
        }
    }
}

// Handle key releases
function keyReleased() {
    if (isGameOver || levelComplete) return;

    if (keyCode === LEFT_ARROW) isLeft = false;
    else if (keyCode === RIGHT_ARROW) isRight = false;
    else if (key === 's' || key === 'S') {
        charSpeed = 10; // Normal speed
    } else if (key === 'f' || key === 'F') {
        // Stop flying when F released
        isFlying = false;
        if (flyingSound && flyingSound.isPlaying()) {
            flyingSound.stop();
        }
    }
}
```

with:

```js
// Shared actions - called by both keyboard handlers and touch controls

function doJump() {
    if (!isFalling && !isPlummeting && !isFlying) {
        isFalling = true;
        gameCharWorldY -= jumpStrength;
        jumpSound.play();
    }
}

function startFlying() {
    if (!isPlummeting && !isFlying) {
        isFlying = true;
        wingFlap = random(0, 100); // Randomize flap start
        if (flyingSound && flyingSound.isLoaded() && !flyingSound.isPlaying()) {
            flyingSound.loop();
        }
    }
}

function stopFlying() {
    isFlying = false;
    if (flyingSound && flyingSound.isPlaying()) {
        flyingSound.stop();
    }
}

function startSpeedBoost() {
    charSpeed = 15; // Speed boost!
}

function stopSpeedBoost() {
    charSpeed = 10; // Normal speed
}

function doRestart() {
    lives = 3;
    isGameOver = false;
    levelComplete = false;
    restartGame();
}

// Handle key presses
function keyPressed() {
    if ((isGameOver || levelComplete) && (key == 'r' || key == 'R')) {
        doRestart();
        return;
    }

    if (isGameOver || levelComplete || isPlummeting) return;

    if (keyCode === LEFT_ARROW) isLeft = true;
    else if (keyCode === RIGHT_ARROW) isRight = true;
    else if (keyCode === UP_ARROW || key === 'w' || key === 'W' || keyCode === 32) {
        doJump();
    } else if (key === 's' || key === 'S') {
        startSpeedBoost();
    } else if (key === 'f' || key === 'F') {
        startFlying();
    }
}

// Handle key releases
function keyReleased() {
    if (isGameOver || levelComplete) return;

    if (keyCode === LEFT_ARROW) isLeft = false;
    else if (keyCode === RIGHT_ARROW) isRight = false;
    else if (key === 's' || key === 'S') {
        stopSpeedBoost();
    } else if (key === 'f' || key === 'F') {
        stopFlying();
    }
}
```

- [ ] **Step 2: Verify behavior is unchanged (manual browser check)**

Run: `cd "/Users/roberto/Desktop/GAME FINAL" && npx http-server . -p 8080`

Using `claude-in-chrome` MCP tools (load with `ToolSearch query: "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__read_console_messages"` first):
1. Open a new tab, navigate to `http://localhost:8080`.
2. Send key `ArrowRight` (hold ~500ms) via the `computer` tool, screenshot, confirm the chicken moved right and score/lives UI unchanged.
3. Send key `Space`, screenshot, confirm the chicken jumped (Y position changed upward).
4. Send key `f` held, screenshot, confirm flying pose renders; release, confirm it stops.
5. Send key `s` held, screenshot, confirm faster movement (character travels farther per unit time than plain ArrowRight).
6. Check `read_console_messages` for any JS errors — expect none.

Expected: all five behaviors match pre-refactor gameplay (same as before this change), no console errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/roberto/Desktop/GAME FINAL"
git add sketch.js
git commit -m "refactor: extract input actions into named functions"
```

---

### Task 2: Add responsive canvas CSS, hero image, and touch control markup to index.html

**Files:**
- Modify: `index.html` (entire file, currently 11 lines)

**Interfaces:**
- Produces (DOM element IDs consumed by Task 3's JS wiring): `#touch-controls`, `#btn-left`, `#btn-right`, `#btn-jump`, `#btn-fly`, `#btn-speed`, `#touch-restart`, `#hero img`.
- Consumes: `assets/screenshot.png` (created in Task 5 — file need not exist yet for this task; a missing image just shows a broken-image icon until Task 5 runs).

- [ ] **Step 1: Replace index.html**

Replace the full file:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="p5.min.js"></script>
    <script src="p5.sound.min.js"></script>
    <script src="sketch.js"></script>
    <style>
      body { padding: 0; margin: 0; background: #222; text-align: center; }
      canvas { max-width: 100vw; height: auto; display: block; margin: 0 auto; }

      #hero { padding: 12px; }
      #hero img { max-width: 480px; width: 100%; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.4); }

      #touch-controls { display: none; position: fixed; inset: 0; pointer-events: none; z-index: 10; }
      #touch-controls.active { display: block; }

      .tc-btn {
        position: absolute;
        width: 64px; height: 64px;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        border: 2px solid rgba(255,255,255,0.6);
        color: #fff;
        font: bold 20px sans-serif;
        display: flex; align-items: center; justify-content: center;
        user-select: none; -webkit-user-select: none;
        touch-action: none;
        pointer-events: auto;
      }

      #btn-left  { left: 20px;   bottom: 40px; }
      #btn-right { left: 96px;   bottom: 40px; }
      #btn-jump  { right: 30px;  bottom: 110px; }
      #btn-fly   { right: 110px; bottom: 160px; }
      #btn-speed { right: 110px; bottom: 60px; }

      #touch-restart {
        display: none;
        position: fixed;
        left: 50%; top: 65%;
        transform: translate(-50%, -50%);
        padding: 14px 28px;
        background: rgba(0,0,0,0.6);
        color: #fff;
        border-radius: 8px;
        font: bold 20px sans-serif;
        pointer-events: auto;
        z-index: 20;
      }
    </style>
  </head>
  <body>
    <div id="hero">
      <img src="assets/screenshot.png" alt="Chicken Run gameplay screenshot">
    </div>
    <div id="touch-controls">
      <div class="tc-btn" id="btn-left">&#8592;</div>
      <div class="tc-btn" id="btn-right">&#8594;</div>
      <div class="tc-btn" id="btn-jump">X</div>
      <div class="tc-btn" id="btn-fly">FLY</div>
      <div class="tc-btn" id="btn-speed">RUN</div>
      <div id="touch-restart">Tap to Restart</div>
    </div>
  </body>
</html>
```

- [ ] **Step 2: Verify markup renders (manual browser check)**

Run: `cd "/Users/roberto/Desktop/GAME FINAL" && npx http-server . -p 8080` (skip if already running from Task 1).

Using `claude-in-chrome` tools: navigate to `http://localhost:8080`, take a screenshot. Confirm:
- Canvas renders and is not overflowing the viewport horizontally.
- Touch control buttons are NOT visible (desktop browser has no touch, `#touch-controls` lacks `.active` class since no JS wiring exists yet — this is expected at this step).
- `read_console_messages` shows no new errors (a 404 for `assets/screenshot.png` is expected and fine at this point).

- [ ] **Step 3: Commit**

```bash
cd "/Users/roberto/Desktop/GAME FINAL"
git add index.html
git commit -m "feat: add responsive canvas CSS and touch control markup"
```

---

### Task 3: Wire touch controls and restart-button visibility in sketch.js

**Files:**
- Modify: `sketch.js` — add `setupTouchControls()` function (place after `stopSpeedBoost()`/`doRestart()` from Task 1, e.g. after line where `doRestart()` ends), call it from `setup()` (`sketch.js:66-71`), and add restart-button visibility toggle at the top of `draw()` (`sketch.js:259`).

**Interfaces:**
- Consumes: `doJump()`, `startFlying()`, `stopFlying()`, `startSpeedBoost()`, `stopSpeedBoost()`, `doRestart()` from Task 1; DOM IDs `#touch-controls`, `#btn-left`, `#btn-right`, `#btn-jump`, `#btn-fly`, `#btn-speed`, `#touch-restart` from Task 2.
- Produces: `setupTouchControls()` (called once from `setup()`).

- [ ] **Step 1: Add setupTouchControls() function**

Insert immediately after the `doRestart()` function body added in Task 1 (still before `function keyPressed()`):

```js
function setupTouchControls() {
    var isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    document.getElementById('touch-controls').classList.add('active');

    function bindHold(id, onStart, onEnd) {
        var el = document.getElementById(id);
        el.addEventListener('touchstart', function(e) { e.preventDefault(); onStart(); }, { passive: false });
        el.addEventListener('touchend', function(e) { e.preventDefault(); onEnd(); }, { passive: false });
    }

    bindHold('btn-left', function() { isLeft = true; }, function() { isLeft = false; });
    bindHold('btn-right', function() { isRight = true; }, function() { isRight = false; });
    bindHold('btn-jump', doJump, function() {});
    bindHold('btn-fly', startFlying, stopFlying);
    bindHold('btn-speed', startSpeedBoost, stopSpeedBoost);

    document.getElementById('touch-restart').addEventListener('touchstart', function(e) {
        e.preventDefault();
        doRestart();
    }, { passive: false });
}
```

- [ ] **Step 2: Call setupTouchControls() from setup()**

Modify `sketch.js:66-71`, replace:

```js
function setup() {
    createCanvas(1024, 576); // Perfect size for my laptop
    floorPosY = height * 3 / 4;
    lives = 3; // Three tries, be careful!
    startGame();
}
```

with:

```js
function setup() {
    createCanvas(1024, 576); // Perfect size for my laptop
    floorPosY = height * 3 / 4;
    lives = 3; // Three tries, be careful!
    startGame();
    setupTouchControls();
}
```

- [ ] **Step 3: Toggle restart button visibility in draw()**

Modify `sketch.js:259-263`, replace:

```js
function draw() {
    if (isGameOver) {
        displayGameOver();
        return;
    }
```

with:

```js
function draw() {
    var touchRestartEl = document.getElementById('touch-restart');
    if (touchRestartEl) {
        touchRestartEl.style.display = (isGameOver || levelComplete) ? 'block' : 'none';
    }

    if (isGameOver) {
        displayGameOver();
        return;
    }
```

- [ ] **Step 4: Verify on emulated touch device (manual browser check)**

Run: `cd "/Users/roberto/Desktop/GAME FINAL" && npx http-server . -p 8080` (skip if already running).

Using `claude-in-chrome` tools with a mobile device emulation (narrow viewport + touch enabled, e.g. via `resize_window` to a phone size and touch-capable tab):
1. Navigate to `http://localhost:8080`, screenshot — confirm the 5 round buttons are now visible bottom-left/bottom-right.
2. Use the `computer` tool to tap-and-hold `btn-right`, screenshot after ~500ms, confirm chicken moved right; release, confirm it stops.
3. Tap `btn-jump` once, screenshot, confirm chicken jumped.
4. Tap-and-hold `btn-fly`, screenshot, confirm flying pose; release, confirm normal falling resumes.
5. Drive the chicken into a canyon or let lives hit 0 (or hold right until reaching the flagpole) to trigger `isGameOver`/`levelComplete`; screenshot, confirm "Tap to Restart" button appears; tap it, confirm the game resets (score back to 0, lives back to 3).
6. Check `read_console_messages` for errors — expect none.

Expected: all touch interactions produce the same effect as their keyboard equivalents from Task 1's verification.

- [ ] **Step 5: Commit**

```bash
cd "/Users/roberto/Desktop/GAME FINAL"
git add sketch.js
git commit -m "feat: wire touch controls to shared input actions"
```

---

### Task 4: Unlock audio on first touch

**Files:**
- Modify: `sketch.js` — add a top-level (outside any function) event listener at the end of the file, after the `BossEnemy` function closes (after `sketch.js:1408`, before the trailing comment on the last line).

**Interfaces:**
- Consumes: p5.sound's global `getAudioContext()` (available once `p5.sound.min.js` has loaded, which it has by the time this script runs since it's loaded via an earlier `<script>` tag).

- [ ] **Step 1: Add the audio-unlock listener**

Append at the end of `sketch.js` (after the closing `}` of `BossEnemy`, before the final `//Coding By Roberto Pires Almeida ends here.` comment):

```js
// Mobile browsers block audio until a user gesture - unlock it on first touch
document.addEventListener('touchstart', function unlockAudio() {
    if (typeof getAudioContext === 'function' && getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}, { once: true });
```

- [ ] **Step 2: Verify audio unlocks on touch (manual browser check)**

Run: `cd "/Users/roberto/Desktop/GAME FINAL" && npx http-server . -p 8080` (skip if already running).

Using `claude-in-chrome` tools on a touch-emulated tab:
1. Navigate to `http://localhost:8080`.
2. Use `read_console_messages` or `javascript_tool` to check `getAudioContext().state` before any interaction — expect `"suspended"` on most mobile browser engines pre-gesture (Chrome desktop may auto-allow; the key check is post-touch behavior below).
3. Simulate a `touchstart` on the page (tap any touch control button via the `computer` tool).
4. Re-check `getAudioContext().state` via `javascript_tool` — expect `"running"`.
5. Confirm no console errors.

Expected: `getAudioContext().state === "running"` after the first touch, meaning `themeSound.loop()` (already called in `startGame()`) is audible.

- [ ] **Step 3: Commit**

```bash
cd "/Users/roberto/Desktop/GAME FINAL"
git add sketch.js
git commit -m "fix: unlock audio context on first touch for mobile playback"
```

---

### Task 5: Capture screenshot and embed in README.md and index.html

**Files:**
- Create: `assets/screenshot.png`
- Modify: `README.md:1-3` (insert image under the title)
- Modify: `index.html` — no markup change needed (Task 2 already added `<img src="assets/screenshot.png">` in `#hero`); this task just makes the file exist.

**Interfaces:** None (leaf task, no other task depends on this one's code).

- [ ] **Step 1: Capture a lively mid-game screenshot**

Run: `cd "/Users/roberto/Desktop/GAME FINAL" && npx http-server . -p 8080` (skip if already running).

Using `claude-in-chrome` tools on a desktop-sized tab (1024x576+ viewport so the canvas renders at full internal resolution, giving a crisp capture):
1. Navigate to `http://localhost:8080`.
2. Drive the chicken forward (hold `ArrowRight` via `computer` tool) for a few seconds to pass the first canyon and reach an area with visible corn and an enemy on screen; time a `Space` jump so the screenshot catches the chicken mid-air near a collectable/enemy for a dynamic shot.
3. Take a screenshot of just the canvas region via the `computer` tool's screenshot capability.
4. Save the captured image to `/Users/roberto/Desktop/GAME FINAL/assets/screenshot.png` (crop to the canvas bounds if the tool captures the full viewport).

Expected: `assets/screenshot.png` exists, shows the game mid-action (chicken, background, at least one corn or enemy visible), roughly 1024x576 or proportional.

- [ ] **Step 2: Embed screenshot in README.md**

Modify `README.md:1-3`, replace:

```markdown
# Chicken Run

A 2D side-scrolling platformer built with [p5.js](https://p5js.org/) during my university studies while learning JavaScript. You play as a chicken collecting corn, dodging butchers, jumping canyons, and racing to the flagpole.
```

with:

```markdown
# Chicken Run

![Chicken Run gameplay screenshot](assets/screenshot.png)

A 2D side-scrolling platformer built with [p5.js](https://p5js.org/) during my university studies while learning JavaScript. You play as a chicken collecting corn, dodging butchers, jumping canyons, and racing to the flagpole. Playable on desktop (keyboard) and mobile (on-screen touch controls).
```

- [ ] **Step 3: Verify both embeds render**

Using `claude-in-chrome` tools:
1. Navigate to `http://localhost:8080`, screenshot, confirm the hero image at the top of the page now shows the captured screenshot (not a broken-image icon).
2. Open the README preview (e.g. `gh repo view synckser/game-final --web` is a shared-state action — instead just visually confirm the markdown image syntax is correct and the file exists at the referenced relative path: `ls assets/screenshot.png` from the repo root).

Run: `cd "/Users/roberto/Desktop/GAME FINAL" && ls -la assets/screenshot.png`
Expected: file exists, non-zero size.

- [ ] **Step 4: Commit**

```bash
cd "/Users/roberto/Desktop/GAME FINAL"
git add assets/screenshot.png README.md
git commit -m "docs: add gameplay screenshot to README and game page"
```

---

## Final Verification

- [ ] Full regression pass: with the server running, test desktop keyboard controls (Task 1's checklist) AND emulated touch controls (Task 3's checklist) both still work in the same session, confirming no regressions across all 5 tasks.
- [ ] Confirm `git log --oneline -6` shows the 5 commits in order, working tree clean (`git status`).
