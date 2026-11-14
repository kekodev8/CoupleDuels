# CoupleDuels V4.3 — Neon Arcade home menu

This project is the V4.2.5 game, updated with the standalone Neon Arcade V4 browse-only home-screen design. It preserves existing Socket.IO rooms, invite QR codes, gameplay and host-only mode selection.

## How to deploy (existing Render service)
1. Open the `sip-happens` folder in this ZIP.
2. Upload its **contents** to the **root** of your GitHub CoupleDuels repository (do not upload the enclosing `sip-happens` directory).
3. Keep the `public` folder structure; new assets are under `public/neon/`.
4. Commit the changes and wait for Render to redeploy.
5. Keep Render **Root Directory blank**; build `npm install`; start `npm start`.
6. Reload your phone browser to pick up the versioned `/app.js?v=430` and `/neon-home.css?v=430`.

## Home-screen behavior
- Swipe side-to-side through all 11 game art cards. Tap a card to scroll to the Create / Join section. **This does not select a game.**
- Create or join a live room, then choose the game from the host's lobby mode selector.
- Mobile and desktop use the same real image assets, with separate layout sizes.
- Settings, sound, leave, pause, and game flow are unchanged outside the home screen.

## Files
Updated: `public/index.html`, `public/app.js`.
Added: `public/neon-home.css`, `public/neon/*.webp` (26 pre-generated assets from the approved preview).

## Validation
`node --check public/app.js` and `npm test` pass (41 tests).
Browser/device visual testing and live two-phone session checks still recommended.
