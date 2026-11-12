# CoupleDuels V4.2 — Pop Culture & Shared Reveals

## Install / deploy

This ZIP contains a `sip-happens` folder. On GitHub, your current repository has `server.js` and `package.json` in its **root**, so upload the **contents** of the ZIP's `sip-happens` folder into the repository root, replacing existing files (including all `public/` files). Do not upload a nested folder named `sip-happens` unless you deliberately configure Render's Root Directory to that folder.

Render: Root Directory **blank**, build `npm install`, start `npm start`, branch `main`. After a successful deploy, open a **fresh room** on each phone and refresh the page. V4.2 uses cache-busted frontend filenames in `public/index.html`.

## What changed

- Distorted Guess: 8 random recognizable movie/cartoon puzzles selected from a pool of Disney, Cartoon Network and Adult Swim titles, now displaying **Wikipedia article thumbnail photos/artwork** retrieved on demand instead of reusing the game's bundled poster images. Mixed answer choices emphasize same-category decoys. Image is obscured until both choose, then both answers are revealed.
- Memory Heist: 8 rounds, larger mixed pool including media and everyday objects (mop, sponge, books, pencils, etc.). Preview times decrease: **4.2 / 3.5 / 3 / 2.6 / 2.2 / 1.9 / 1.6 / 1.3 seconds**. The next image thumbnail is preloaded during the Ready screen when possible.
- Mind Meld, Emoji Rush, Rapid-Fire Chaos, Couples Compatibility prediction rounds, Distorted Guess and Memory Heist: Both players get symmetrical reveal feedback. Neither is forced forward after a few seconds: the reveal remains until **both press Ready**.
- Compatibility: Phase 1 original answers still stay hidden until the guessing phase so the game cannot be spoiled. Guess reveals explicitly show both players' original answers and both predictions.
- Emoji Rush: refreshed animated movie, Cartoon Network and Adult Swim clues including recent recognizable titles.
- Lobby cards: updated focal cropping and overlay gradients for text legibility.

### Important image availability and rights note

Media images are **not bundled or copied** into this ZIP. When an image game runs, the browser queries Wikipedia's public `pageimages` endpoint (`https://en.wikipedia.org/w/api.php`) and loads the article thumbnail on each device. An internet connection to Wikipedia is required **in addition to** your Render game connection. Some articles may lack a thumbnail or a mobile network may block or delay Wikipedia; the game displays an unavailable-image message in this case. This integration has not been tested on two physical phones. Thumbnail copyright and licenses belong to their respective rights-holders, not CoupleDuels. Do not redistribute thumbnails without checking the rights for each image.

## Testing

The included Node.js suite: `npm test` — 35 tests passing locally including new tests for reveal timing, media pools and difficulty progression. Full two-phone network/image-loading test still required.

---

# CoupleDuels V4 — Graphite Arcade Edition

## Upgrading your live CoupleDuels deployment

Your existing GitHub repo runs from **`sip-happens`** (if you followed the prior Render setup). Copy the **contents** of this package's `sip-happens` directory into that existing folder and replace older files. Do not create `sip-happens/sip-happens`. Commit, then deploy latest commit on Render. `npm install` and `npm start` remain unchanged. Make sure `public/v4.css`, `public/manifest.webmanifest`, and the new `public/art/hero-*.webp` files are uploaded too.

## V4 release notes

- Rebuilt visual layer: deep graphite/teal app shell, compact sticky navigation, consistently spaced phone-first panels, distinct accent colors for every game mode.
- Reworked mode selection to display full, uncropped illustrations (`object-fit: contain`) with mode-specific selection states. No more indiscriminate CSS cropping of art assets.
- New standalone artwork files for the eight SipBattle hero/ally portraits. Character selection and battles now show image portraits instead of emoji avatars.
- Create Story now changes background scene art by chapter, and maintains the existing 45-second turns / 4–6 exchanges per twist.
- Kart Clash retains phone motion steering, five tracks and mystery-box power-ups, with a larger pickup collision lane to make boxes less frustrating to collect; track art displays fully; motion fallback remains available.
- App manifest and install icon, so "Add to Home Screen" can display CoupleDuels as a standalone app window when the browser supports it. This is **not** an offline multiplayer game; a network connection is still required.
- Preserves all eleven V3 game modes, multiplayer rooms, QR joining, pause, and rematch logic.

## Scope and testing

V4 is a visual/UI and interaction overhaul of the existing **2D browser game**. It is not a native app, 3D racing engine, or a full commercial studio production. Most existing gameplay logic is preserved deliberately to avoid destabilizing two-phone multiplayer. All existing unit tests pass locally; physical iPhone/Android sensor behavior and full UI playtests remain to be verified after deployment.

## Start locally

Run `npm install`, then `npm start` and open `http://localhost:3000`. For phone-to-phone play, deploy the Node service publicly with HTTPS.

---

# CoupleDuels — V2.4: Arcade Expansion

A real-time browser game for two phones (Android + iPhone) with a private QR-code room.

## Game modes

- **Rapid-Fire Chaos:** 20 untimed cards: four chapters, each with 4 random questions followed by 1 acting/challenge prompt, sampled from a 90-card bank. Acting challenges advance after both players press Done. Recent prompts are avoided during rematches in the same room.
- **Couples Compatibility:** both players privately answer the same 10 randomly selected questions from a 50-question bank, then each predicts the partner's previous answer on 5 questions. Combined match percentage is shown after the game.
- **SipBattle:** select yourself + 2 of 7 allies, claim up to 5 upgrade points (no drinking required), buy character upgrades and fight turn-by-turn. Two new allies: Arrow (piercing shot) and Luna (moonlight shield).
- **Create Story:** spoken cooperative storytelling with **five chapters**, with 4–6 exchanges per chapter and 45-second speaking turns. After each chapter, an unexpected story twist is shown **without a timer**, and both players press Ready to continue. The fifth twist is a randomized ending prompt. Player 1 begins the ending and Player 2 finishes it. No scores, winner or loser. No audio recording or story transcription; speak aloud together.

## New modes in V2.4

- **Mind Meld:** 7 rounds. Both choose secretly from 4 options and score 2 points each for matching choices. No question timers.
- **Emoji Rush:** 8 emoji puzzles; independently guess the correct phrase, movie, or idea from four choices. Each correct answer earns 1 point. No question timers.
- **Tap Duel:** 5 simultaneous eight-second heats. Both players tap on their own phones; most valid taps wins 1 point. A 2.5-second countdown starts after both tap Ready, and the server rate-limits taps to protect against impossible input speeds. Shared Pause freezes the heat countdown.
- **Kart Clash visual upgrade:** the same tested 2D racing engine now has vector-drawn multi-layer roads, richer map-specific scenery, detailed karts, obstacle glows, checkered finish markers, and enhanced HUD. It is still a 2D arcade racer, not full 3D.

## Important updating instructions

Your Render service should still use **Root Directory `sip-happens`** if you uploaded your game beneath that GitHub folder. Do not put a new `sip-happens` folder inside the existing one. Upload the *contents* of the new `sip-happens/` folder in the ZIP to `CoupleDuels/sip-happens/` on GitHub, **replacing** existing files (especially `server.js`, `game.js`, `public/app.js`, `public/index.html`, `public/style.css`, `rapid.test.js`, and `pause.js`) and **adding** `minigames.js` and `minigames.test.js`. Then commit and check the Render deployment logs, refresh both phones, and create a new room.

Because past updates sometimes landed in the wrong GitHub folder, verify that the deployed directory contains `minigames.js` beside `server.js`. `package.json` must be in that same directory. The service needs `npm install` and `npm start`.

## Shared Pause / Resume

Either player can tap **⏸ Pause** during an active game or results reveal. Both phones show a full-screen break overlay. **▶ Resume together** is available to either player. On pause, all game actions are temporarily blocked and the server freezes the story countdown, reveal timer, and Kart Clash simulation (including boost, obstacle delays, and the starting countdown). Rapid-Fire and Compatibility questions remain untimed. The current party and scores are preserved. Leaving the party is still a separate action.

## New design / sound

Mobile-first cards, large touch-friendly controls, illustrated SVG scene cards, colorful character selection, smoother reveals, HP bars, progress indicators and status chips. A Sound On/Off control plays small locally synthesized sounds for right predictions/matches, SipBattle actions and victory/defeat, and story transitions. There are no downloaded audio assets and no user audio collection. Because browsers restrict autoplay, sound starts after you tap Sound On.

## Deploy to your existing Render service

Your previous setup used **Root Directory: `sip-happens`**, so keep that setting if your project is in `CoupleDuels/sip-happens` on GitHub.

1. Extract this ZIP. It contains one folder named `sip-happens`.
2. In GitHub, open `CoupleDuels/sip-happens` and upload the **contents** of the extracted `sip-happens` folder there. Do not accidentally create `sip-happens/sip-happens`.
3. Critical updated files are `server.js`, `public/app.js`, `public/index.html`, `public/style.css`; **new** files are `pause.js` and `pause.test.js`.
4. Commit the files to `main`. Render redeploys automatically if enabled; otherwise use Manual Deploy → Deploy latest commit.
5. When Render reports Live, refresh the game on **both phones** and create a new room to test the pause feature.

Render settings: Node, Root Directory `sip-happens` for the nested GitHub structure above, Build `npm install`, Start `npm start`. If you instead store the project files at repository root, leave Root Directory blank.

## Local development

Requires Node.js 20+:

```bash
npm install
npm start
```

Open <http://localhost:3000>. Open a second tab to simulate another player; a public HTTPS deployment is required for normal phone QR joining outside your local device.

## Run automated checks

```bash
npm test
node --check server.js
node --check public/app.js
```

## Notes

- All game rooms are in memory and reset after a server restart; there is no account or database.
- Sound is optional and can be muted any time. No microphone permissions are needed for Create Story; it is a spoken, in-person game, not voice chat.
- **Drinking is optional**. No upgrade points or gameplay outcomes depend on consuming alcohol; choose water or nonalcoholic drinks instead. Never pressure anyone to drink.
- Logic tests pass; real two-phone network and audio interactions should still be tested on the deployed site.

## Create Story pacing (V2.1)

- Five chapters, with **4–6 full two-player exchanges per chapter** (8–12 speaking turns before each plot twist).
- **45 seconds per player turn**, with an optional Done Speaking button for early finishes.
- Plot-twist cards are **untimed** until both players press Ready.
- After the fifth chapter, the final prompt is also untimed; each player gets one 45-second ending turn.
- No score or winner.

The server handles chapter lengths and timing; upload all files, including `story.js`, `story.test.js`, and `public/app.js`, preserving the folder structure.


## CoupleDuels V2.2 — Kart Clash (new fifth mode)

- **Kart Clash** is an original two-player top-down real-time kart racer (not a Nintendo/Mario Kart game).
- Choose one of **five drivers** (Blaze, Bubbles, Pickle, Nova, Ghost) with small stat differences.
- Host chooses one of **five tracks** (Candy Coast, Neon Nights, Dusty Dash, Frostbite Pass, Cosmic Circuit).
- Both players tap Ready, get a synchronized countdown, then race from separate phones.
- Cars auto-accelerate. Hold **Left**, **Right**, or **Nitro**; steer around obstacles and keep to the roadway.
- Nitro regenerates; glowing pickups refill it. Server simulates position, speed, obstacles, and finish order.
- The losing player may choose a **small optional sip**, water, or a silly forfeit. Never mandatory.
- No downloads for players. Deploy this Node app to Render as before and open your existing HTTPS website on each phone.

### Update from V2.1

In your GitHub `sip-happens` directory, add **race.js** and **race.test.js**; replace **server.js**, **public/app.js**, **public/style.css**, and **public/index.html**. Commit. Keep the Render root directory `sip-happens`. If auto-deploy is disabled, choose Manual Deploy → Deploy latest commit. Start a *new room* to select Kart Clash.

### Testing notes

`npm test` runs 15 existing and new logic tests. The two-phone live race and mobile touch controls still require actual device verification. Race rooms are held in server memory, as with the other modes, and reset if the instance restarts.

## Racing upgrades (motion + mystery boxes)
Kart Clash now supports optional phone tilt steering in the browser. On iOS, tap **Enable Motion Steering** after starting a race to grant Safari motion access; permission requires HTTPS. On Android, allow sensor permissions if prompted. Orientation sensors may be unavailable in some browsers. Use the on-screen steering buttons as a fallback. Landscape orientation is recommended; orientation lock is controlled by phone/browser settings and cannot always be forced by the game.

Drive over question-mark item boxes to collect one random item. Tap **Use Item** to activate Turbo Burst, Bubble Shield, Zap Bolt, Oil Slick, or Nitro Refill. The server validates items and applies effects. The original five tracks, eight modes, pause/resume, and game flow remain available. The art remains mostly procedural; the large image-asset redesign and three additional modes are **not part of this particular build**.

## CoupleDuels V3.0 — Arcade & Art Update

This build extends V2.5, preserving all existing game modes, Kart Clash motion steering and mystery-box items. New modes:

- **Distorted Guess:** eight blurred original visual clues, untimed. Each correct answer scores two points; clues reveal once both players answer.
- **Quick Draw Duel:** seven reaction heats. Both ready up, a randomized delay begins, and an early tap is a false start. Fastest valid tap wins the heat.
- **Memory Heist:** six illustrated image-memory rounds. Both players ready up; the image is visible for 6.5 seconds then concealed for an untimed four-choice guess.

Includes 26 original illustrated WebP assets extracted from artwork made for CoupleDuels. Lobby cards and racing map previews use image assets instead of emoji-only placeholders. The earlier eight games remain included; the browser lobby now offers eleven total modes.

**Update existing deployment:** Replace the contents of the GitHub `sip-happens/` directory with the contents of this ZIP's `sip-happens/`, including `arcade.js`, `public/arcade-ui.js`, `public/arcade.css`, and `public/art/*.webp`. Keep your Render root directory as `sip-happens`, then deploy the latest commit. Never upload an extra nested `sip-happens/sip-happens` directory. Restart or create a new room after deployment and refresh both phones.

**Validation:** Run `npm test`; ensure `npm install` and `npm start` work in your hosting environment. New modes have automated rules tests but still require physical two-phone UX testing. Some graphics remain Canvas-rendered (notably the racing road and kart), and the artwork layer is a polish pass rather than full 3D racing graphics.


## V4.1 — Per-device Settings

Tap **⚙ Settings** from the top bar anywhere in the app. Choose **Auto**, **Phone** or **Computer** layout; toggle **Game sounds** and **Visual effects**. Settings are stored in each device's browser localStorage and do not affect the other player's settings. "Computer" mode on a small device still fits the available width. Kart Clash motion steering remains optional and controlled separately in that mode. The existing sound button remains a shortcut.

Upload **public/settings.js**, **public/settings.css**, and the updated **public/index.html** to the deployed repo; no server changes or new environment variables are necessary.

## V4.1.2 host phone mode-selection fix

- This release deliberately retains host-only game selection. It **does not** include the proposed V4.1.1 permission change.
- The lobby mode cards use a stable delegated click handler that works when tapping card artwork, titles, or empty card space.
- A status line shows the currently selected mode and whether the server accepted the change.
- The `index.html` references to `app.js` and `v4.css` have versioned URLs to reduce stale mobile-browser caching.
- If your phone still cannot switch modes, confirm it says **Host** beside your player name and the currently selected mode message. If it does not, the host session is open on a different browser/device; create a fresh room on the phone you want as host.

Replace `public/app.js`, `public/v4.css`, `public/index.html` in the **main repository public folder**, commit, let Render redeploy, then make a new room on the host phone.
