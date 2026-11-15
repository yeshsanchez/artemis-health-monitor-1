# A.R.T.E.M.I.S.

**Daily astronaut health, diet & mind monitor that adapts to where the crew is: the ISS, the Moon or Mars.**
NASA Space Apps prototype.

Astronauts are busy engineers, pilots and scientists, not doctors. A.R.T.E.M.I.S. turns body, food and mental-health readings into three plain-language levels: **Normal**, **Drift** and **Critical**. It says what to do next, adjusted to the person's profile and location. On Mars, where messages to Earth take up to 22 minutes, it guides the crew on its own.

## Features

| Area | What it does |
|---|---|
| **Crew profile** | Body stats, sex and cycle mode, medical history, diet and HRV baseline. These set personal calorie, protein, water and iron targets, safe zones and safety checks (e.g. no ibuprofen advice when NSAID-sensitive). |
| **3D body map** | Rotatable hologram body with **Organs / Surface / Skeleton** views and Front/Side/Back angles. Each body area glows by status; click one to focus the camera and filter the readings. |
| **≈50 readings** | Physical (eye pressure, bones, hydration, radiation, suit CO₂…), vital signs (heart rate, SpO₂, breathing), mind & sleep (sleep stages, HRV, reaction test, sleepiness, stress, journal tone), food & water (12 nutrients), and cycle health (two modes). The list changes with location and profile. |
| **Location-aware** | 5 locations: ISS, deep-space transit, Moon base, Moon rover, Mars. Safe zones change per location, and the advice notes when kit isn't available there (e.g. "no leg vacuum on the rover — do this instead"). Mars and transit run in **self-guided mode** with an adjustable signal delay. |
| **Timeline** | 14D / 30D / 90D / Mission views from saved daily history, a shaded safe zone and a **7-day forecast** that warns before a reading drifts out of range. |
| **1–7 gauge** | Every reading shows its position on the research's 1–7 scale (Very low … Normal … Very high), so "slightly off" and "very off" look different. |
| **Plain language** | "What it means", "Why it matters" and "How to measure" with a picture for each measuring method. Medical words are tap-to-explain, and there's a full glossary. |
| **Daily routine** | Duolingo-style check-ins that tick themselves off when you log, a day streak with a 7-day row, busy/spacewalk mode to protect the streak, and time-of-day reminders (optional browser notifications). |
| **Food log** | Pick or "scan" galley pouches, set portion size, quick-add drinks, see live progress against targets, then save the day's totals. |
| **Mind** | 30-second sleep/sleepiness/stress check-in, a 1- or 3-minute reaction test (PVT), a private journal scored **on the device**, and coping exercises (CBT) when stress or tone is low. |
| **Data** | Everything is saved in the browser. Export to JSON in the team's diet-spec format or the Mars-spec format (with 3D body-map coordinates). |

## Run it

No build step. Open `index.html` in a browser (Chrome, Edge, Firefox, Safari).
It loads Chart.js 4.4.1 and Three.js r147 from the jsDelivr CDN, so it needs an internet connection the first time.

To host it, enable **GitHub Pages** (Settings → Pages → deploy from `main`, root). GitHub Pages on a private repo needs a paid plan, so make the repo public before submitting.

**Demo flow for judges:** Mission tab → **Load 45-day mission log** → try **Drift** and **Critical** → switch location to Mars → rotate the body → open the Food and Today tabs.

## Project layout

```
index.html          page markup
css/app.css         design tokens (60-30-10 palette) and components
js/metrics.js       every metric, its 1–7 boundaries, sources and advice
js/content.js       glossary, galley menu, measuring pictures, coping exercises
js/engine.js        triage logic: levels → Normal/Drift/Critical, forecast, targets
js/body3d.js        Three.js body viewer
js/app.js           UI, check-ins, food log, journal, PVT, storage, export
docs/thresholds.md  where every number comes from + open decisions for the team
```

## Color system (60-30-10)

Derived from the prototype's sky blue `#38bdf8`:

| Share | Role | Tokens |
|---|---|---|
| 60% | Page background (deep navy) | `--bg #070d17`, `--bg-2 #0a1220` |
| 30% | Cards, inputs, panels | `--surface #0e1829`, `--surface-2 #132138`, `--line #1c2c44` |
| 10% | Actions, selection, focus | `--accent #38bdf8`, `--accent-hover #7dd3fc` |

Green / amber / red are reserved for health status only. All text colors pass WCAG AA contrast.

## Integration hooks

```js
window.ingestTelemetryPayload({ onsd: 5.8, sodium_intake: 3200 });   // log readings (optional 2nd arg: timestamp)
window.ingestBackendSnapshot(json);   // diet-spec, mental-health-spec or Mars-spec JSON
window.exportBackendSnapshot();       // diet-spec format + fatigue/sleep/journal blocks
window.exportMarsSnapshot();          // Mars spec v2: body_map_nodes + telemetry_payloads
window.getCrewProfile(); window.setCrewProfile({...});
```

*Not a medical device. Ranges come from the team's research documents. See `docs/thresholds.md`, including the decisions the team still needs to confirm.*
