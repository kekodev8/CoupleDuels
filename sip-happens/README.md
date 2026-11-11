# CoupleDuels — Game Night V2.0

A real-time browser game for two phones (Android + iPhone) with a private QR-code room.

## Game modes

- **Rapid-Fire Chaos:** 15 untimed prompts (5 from each of 3 stages), randomly selected from 90. Acting challenges advance after both players press Done. Recent prompts are avoided during rematches in the same room.
- **Couples Compatibility:** both players privately answer the same 10 randomly selected questions from a 50-question bank, then each predicts the partner's previous answer on 5 questions. Combined match percentage is shown after the game.
- **SipBattle:** select yourself + 2 of 7 allies, claim up to 5 upgrade points (no drinking required), buy character upgrades and fight turn-by-turn. Two new allies: Arrow (piercing shot) and Luna (moonlight shield).
- **Create Story:** spoken cooperative storytelling with **five chapters**, each with two 30-second speaking turns. After each chapter, an unexpected story twist is shown **without a timer**, and both players press Ready to continue. The fifth twist is a randomized ending prompt. Player 1 begins the ending and Player 2 finishes it. No scores, winner or loser. No audio recording or story transcription; speak aloud together.

## New design / sound

Mobile-first cards, large touch-friendly controls, illustrated SVG scene cards, colorful character selection, smoother reveals, HP bars, progress indicators and status chips. A Sound On/Off control plays small locally synthesized sounds for right predictions/matches, SipBattle actions and victory/defeat, and story transitions. There are no downloaded audio assets and no user audio collection. Because browsers restrict autoplay, sound starts after you tap Sound On.

## Deploy to your existing Render service

1. Extract the zip; the extracted project folder is `sip-happens`.
2. Upload **all files and folders inside `sip-happens`** to the **root** of your existing GitHub `CoupleDuels` repository (not the ZIP itself). In particular, include **new `story.js` and `public/art/`** and replace old `server.js`, `game.js`, `sipbattle.js`, `public/app.js`, `public/style.css`, `public/index.html`.
3. Commit to `main`. Render should redeploy automatically if auto-deploy is enabled. Otherwise use **Manual Deploy → Deploy latest commit** in Render.
4. Open the public Render URL on both phones; create a **new room** after redeploying to load the updated version.
5. If the browser keeps showing the previous design, refresh the page or close/reopen the web tab.

Render web service configuration:
- Language: Node
- Root Directory: empty
- Build Command: `npm install`
- Start Command: `npm start`

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
