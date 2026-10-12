# EDM DODGE · RELI

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

## First mission: Neon Overdrive

Original procedural synth EDM, 144 BPM, exactly 120 seconds. Audio and obstacles share the Web Audio clock; a deterministic beat chart makes retries consistent.

| Section | Beats | Seconds | Experience |
| --- | --- | --- | --- |
| Intro | 0–32 | 0–13.3 | Straight missiles, drone introduction |
| Build | 32–64 | 13.3–26.7 | Gates, paired missiles, mines |
| Drop 1 | 64–128 | 26.7–53.3 | Missile bursts, warning lasers |
| Breakdown | 128–160 | 53.3–66.7 | Reduced pressure |
| Drop 2 | 160–224 | 66.7–93.3 | Smaller gaps, brief homing missiles |
| Finale | 224–288 | 93.3–120 | Faster barrage; threats stop before track end |

Earn 25 points per second plus 100 per near miss multiplied by flow. Every five consecutive near misses raises the multiplier, up to ×5. A hit resets flow. Each threat can award one near miss. Completed runs rank S (no hits and at least 12 near misses), A (at most one hit and at least five near misses), B (at most two hits), otherwise C. Personal bests are stored separately per difficulty in the browser.

## Development

```sh
npm test
```

`dist/engine.js` owns deterministic choreography, movement, swept collision, scoring and game states. `dist/audio.js` owns the original synth soundtrack and audio lifecycle. `dist/game.js` owns rendering, input and UI. All shipped assets are local. Reduced effects mode and mute are available. This is the first prototype, not the planned 3D version. Future tracks can replace the procedural audio while retaining the shared clock and beat chart.
