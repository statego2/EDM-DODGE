# EDM DODGE · RELI

**Version 0.2 — Three playable 2D missions, local career medals, and continuous mobile steering.**

A playable **2D arcade rhythm-dodge game**. Pilot an experimental combat craft through a neon simulation, survive a two-minute original EDM track, and earn style points by flying close to danger.

## Play locally

Requires Python 3. No packages, build step, account, or external assets required.

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. On iPhone open the deployed game in Safari; audio starts after **Launch Mission**.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Fly | WASD / arrows | Drag anywhere in the arena; movement is relative to your finger |
| Phase dash | Space | PHASE DASH button |
| Pause | P / Escape / pause button | Pause button |

Phase dash gives 0.32 seconds of protection and recharges in 3.5 seconds. Pilot has three shields, Rookie five, Ace one. Damage grants a short recovery window. Backgrounding the game pauses both audio and gameplay; resume requires a tap.

## Mission 01: Neon Overdrive

Original procedural synth EDM, 144 BPM, exactly 120 seconds. Audio and obstacles share the Web Audio clock; a deterministic beat chart makes retries consistent.

| Section | Beats | Seconds | Experience |
| --- | --- | --- | --- |
| Intro | 0–32 | 0–13.3 | Straight missiles, drone introduction |
| Build | 32–64 | 13.3–26.7 | Gates, paired missiles, mines |
| Drop 1 | 64–128 | 26.7–53.3 | Missile bursts, warning lasers |
| Breakdown | 128–160 | 53.3–66.7 | Reduced pressure |
| Drop 2 | 160–224 | 66.7–93.3 | Smaller gaps, brief homing missiles |
| Finale | 224–288 | 93.3–120 | Faster barrage; threats stop before track end |

Earn 25 points per second plus 100 per near miss multiplied by flow. Every five consecutive near misses raises the multiplier, up to ×5. A hit resets flow. Each threat can award one near miss. Completed runs rank S (no hits and at least 12 near misses), A (at most one hit and at least five near misses), B (at most two hits), otherwise C. Personal bests and career stars are stored separately per mission and difficulty in the browser.

## Development

```sh
npm test
```

`dist/engine.js` owns deterministic choreography, movement, swept collision, scoring and game states. `dist/audio.js` owns the original synth soundtrack and audio lifecycle. `dist/game.js` owns rendering, input and UI. All shipped assets are local. Reduced effects mode and mute are available. This is an expanded 2D prototype with three missions, not the eventual planned 3D version. Future tracks can replace the procedural audio while retaining the shared clock and beat chart.


## Additional missions

| Mission | Identity | Special mechanics |
| --- | --- | --- |
| **01 — Neon Overdrive** | Pilot training | Base missiles, gates, mines and 4 salvage capsules |
| **02 — Skyfire Siege** | Crossfire endurance | Fan bursts, increased speed and tracking |
| **03 — Phantom Rift** | Elite assault | Lateral ambushes, pursuit and 3 hunter-carrier mini-boss waves |

Each mission has its own procedurally synthesized chord progression and melodic variation at 144 BPM. They all use the existing deterministic 2-minute beat architecture. The new `dist/missions.js` contains the authored variations, while `dist/progression.js` keeps replay objectives and record handling independent of the browser.

**Salvage capsules** restore one shield when damaged or grant a scoring bonus at full integrity. **Three-star missions** reward completing the track, reaching a mission-specific near-miss target, and collecting enough capsules. Old high scores are still read for original Neon Overdrive runs.

## Test and development

```sh
npm run check
npm test
npm start
```

Node.js 22 and Python 3 are used for development. All game assets are native browser modules in `dist/` — no npm install is required. Tests cover collision and movement invariants, deterministic event charts, procedural audio lifecycle, challenge progression, static source integrity, and a full 120-second headless engine simulation for each mission.

## Publish to an iPhone-accessible URL

The repository includes `.github/workflows/ci.yml`. It validates the game and publishes `dist/` via GitHub Pages when Pages is enabled.

The repository administrator must visit **Settings → Pages → Build and deployment → Source: GitHub Actions**. After the deployment succeeds, the typical URL will be `https://statego2.github.io/EDM-DODGE/`; do not assume this is already live before checking the Actions run. Open the URL in Safari and tap **Launch Mission** to enable audio playback.

## Remaining milestones

Real-device iOS Safari playtesting and balance tuning, improved art and clarity of projectile hitboxes, a more elaborate finale, optional gamepad support, professionally produced original tracks, and later an online leaderboard. Spotify tab audio is **not** inspected or captured.

## Offline iPhone play

The `dist/` build now ships a minimal installable PWA (`manifest.webmanifest`, `icon.svg`, `sw.js`). On an HTTPS deployment, **Safari → Share → Add to Home Screen** can install the game. The network-first service worker caches all modules after the first successful load so the installed game can reopen offline. Sound is generated locally via Web Audio; no streaming audio is required. Clear Safari website data if you need to reset local records or storage.

**Balance note:** the final Phantom Rift phase is intentionally structured as three readable hunter-carrier encounters instead of adding the carrier waves on top of the entire existing bullet chart. This is a prototype tuning adjustment, not yet validated by human completion-rate data.
