# SIP HAPPENS — Couples Edition

A playable 2-player browser party game with **real-time Socket.IO syncing**, a QR-code invite, 15 rounds, shared scoring, and three mild progression stages. Android and iPhone can play together.

## Features
- Host creates a private 6-character room code.
- Second player scans a QR or enters the code. No accounts.
- Each device sees the round simultaneously and submits its own answer.
- Answers stay hidden until both players respond.
- 3 game types: secret votes, mind-matching, and co-op challenges.
- 15 rapid-fire rounds, 3 stages (warmup / playful / chaos), live scores and finale.
- Reconnects when a phone refreshes or loses connection (same browser).
- Optional sips only; drinking is never required.

## Run locally
Install Node.js 20+.

```bash
npm install
npm start
```

Then open `http://localhost:3000` on the host computer. To test two players locally, open two tabs (use a private/incognito tab for the second player so their token is separate).

## Make it work on both phones (recommended)

Deploy this folder as a **Node.js web service** on Render, Railway, or another Node host. With Render:
1. Upload this project to a GitHub repository.
2. On Render, choose **New → Web Service**, connect the repo, choose Node, use `npm install` and `npm start` (or deploy using `render.yaml`).
3. Open the resulting public `https://...` address on your first phone. Create a room.
4. Have your partner scan the on-screen QR with their iPhone/Android camera. Once both players are connected, tap **Start**.

**Important:** `localhost` and `127.0.0.1` links only work on your own device, not your partner's phone. QR joining across both phones requires a public HTTPS deployment or an appropriate LAN-accessible host URL. This application stores rooms only in server memory, so use one server instance; restarts reset rooms. No permanent database or login is needed for this MVP.

## Gameplay & scoring
- **Match:** both independently pick the same choice → +2 each.
- **Vote:** both choose the same actual person, taking their player-relative options into account → +2 each.
- **Challenge:** both tap DONE → +1 each.
- No countdowns on questions or challenges: both players answer (or tap DONE) to proceed.
- After both players finish, the answer reveal lasts 3.5 seconds, then the next round starts. Questions never expire.
- The pace never requires alcohol consumption; nonalcoholic drinks are always welcome.

## Dev notes / next enhancements
Add packs and question editor, accessibility settings, optional safe drinking-rule toggle, persistent rooms, sound effects, and a spectator mode. For scaling to multiple instances, replace the in-memory room map with Redis and use a compatible Socket.IO adapter.

## New mode: 💘 Couples Compatibility

Select **Couples Compatibility** in the room lobby before pressing Start. The host picks the mode, and both phones update together.

**Phase 1 — 10 questions about yourselves:** Each person gets the same 10 randomly selected prompts from a 30-question bank and privately chooses one of four answers. There is no countdown; both players have as long as they need. Answers are never sent to the other phone during this phase, so neither player can copy the partner's response. Questions advance when both players answer.

**Phase 2 — 5 questions about your partner:** The game randomly selects 5 of the *same* original questions. Each person predicts the answer their partner gave. Both guess independently without a timer. A five-second synchronized reveal then displays each real answer and each guess.

**Scoring:** Each correct prediction earns the guessing player one point. There are five guesses per player and ten possible correct guesses as a couple; compatibility is `(correct guesses / 10) × 100%`. The final screen shows the shared percentage, individual 0–5 scores, and a question-by-question breakdown. An unanswered question is not counted as a correct match; no drinking penalties are attached. This is an entertainment quiz, not a scientific measure of relationship compatibility.

A rematch returns to the room lobby so you can choose a different mode; replaying Compatibility generates a new random set.

Quick automated checks: `node --test` (no dependencies needed for the question-deck tests).

## ⚔️ SipBattle — new mode (V1.2)

From the lobby select **SipBattle**. Each player gets their own hero and drafts **two distinct allies** from Bulwark (tank), Hex (mage), Patch (medic), Jinx (rogue), and Echo (bard). Both players lock in before a shared upgrade shop opens.

In the shop, tap **+1 Power Point** up to five times, and spend 1–5 points on weapon and skill upgrades. A sip, water, or no drink is optional and all grant the **same** game point; no alcohol consumption is monitored or required. Every player can earn up to five power points. You may choose to purchase upgrades or keep some points unused. Both players press **Ready to Fight** to start the turn-based, synchronized combat arena.

Choose a living attacker, a living enemy target, and **Attack**, **Special**, or **Guard**. Your main character is affected by weapon/armor/special upgrades, and allies have their own special abilities. The server validates all actions, computes HP and damage, keeps turn order, and declares a winner when all three enemies are defeated (or after 100 turns based on remaining total HP). The losing player may *optionally* take a small sip or choose an alcohol-free forfeit. Rematches return both players to the lobby and reset battle state.

Note: Shop points are intentionally not conditional on drinking; this avoids rewarding fast alcohol consumption. The game is playable with water or no beverages at all. No time limit is placed on the battle.

## V1.3: Leave party fix
- A **Leave party** button is visible throughout active Rapid-Fire, Compatibility and SipBattle sessions, not only in the lobby/finale.
- Leaving sends a server event before returning to the home screen; this releases the player's room slot.
- When a guest leaves, the host returns to the lobby and may invite a second player again.
- When the host leaves, the room closes and the guest returns to the home screen.
- If connection drops, Leave still clears the local session so the player isn't trapped on a game screen.

To update a deployed GitHub repository, replace `server.js`, `public/app.js`, `public/index.html`, and `public/style.css` with the new versions, commit to `main`, and let Render redeploy.

## V1.4: Untimed gameplay
- Rapid-Fire Chaos votes, match questions and acting challenges do not have countdowns.
- Couples Compatibility personal questions and partner guesses are untimed too.
- Both players must submit their answer or tap DONE for a challenge before progression.
- Short result reveals remain automatic (3.5 seconds in Chaos, 5 seconds in Compatibility).
- SipBattle remains turn-based and untimed.
- If a player disconnects, the room waits for reconnection instead of skipping their answer.

To update an existing Render deployment, replace `server.js`, `game.js`, and `public/app.js` in the existing GitHub repository and commit to `main`.
