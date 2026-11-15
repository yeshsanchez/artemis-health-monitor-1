<p align="center"><img src="assets/logo.png" alt="ARTEMIS" width="360"></p>

# A.R.T.E.M.I.S.

**Daily astronaut health, diet & mind monitor that adapts to where the crew is: the ISS, the Moon or Mars.**
NASA Space Apps prototype.

Astronauts are busy engineers, pilots and scientists, not doctors. A.R.T.E.M.I.S. turns body, food and mental-health readings into three plain-language levels: **Normal**, **Drift** and **Critical**. It says what to do next, adjusted to the person's profile and location. On Mars, where messages to Earth take up to 22 minutes, it guides the crew on its own.

## Features

| Area | What it does |
|---|---|
| **Crew profile** | Body stats, sex and cycle mode, medical history, diet and HRV baseline. These set personal calorie, protein, water and iron targets, safe zones and safety checks (e.g. no ibuprofen advice when NSAID-sensitive). |
| **3D anatomy** | Real human anatomy (BodyParts3D): rotatable, zoomable, with **Skin / Muscles / Skeleton / Organs** layer toggles and Front/Side/Back views. Organs glow amber/red when their area is in Drift/Critical, floating cards label the problem areas, and clicking an area x-rays the body and focuses the camera. |
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
**Works fully offline.** Chart.js, Three.js, the font and the 3D anatomy are bundled in the repo (`vendor/`, `models/`), and all data is stored in the browser, which suits a crew that may be minutes away from Earth.

To host it, enable **GitHub Pages** (Settings → Pages → deploy from `main`, root). GitHub Pages on a private repo needs a paid plan, so make the repo public before submitting.

**Demo flow for judges:** Mission tab → **Load 45-day mission log** → try **Drift** and **Critical** → switch location to Mars → rotate the body → open the Food and Today tabs.

## Project layout

```
index.html          page markup
css/app.css         design tokens (60-30-10 palette) and components
js/metrics.js       every metric, its 1–7 boundaries, sources and advice
js/content.js       glossary, galley menu, measuring pictures, coping exercises
js/engine.js        triage logic: levels → Normal/Drift/Critical, forecast, targets
js/body3d.js        Three.js anatomy viewer (layers, hotspots, status glow)
models/body.glb.js  BodyParts3D anatomy, simplified to ~4 MB, embedded so it works from disk
tools/build-body.mjs rebuilds the model from the BodyParts3D download
assets/             logo (wordmark), mark (A), favicon
vendor/             Chart.js, Three.js, font (bundled for offline use)
js/app.js           UI, check-ins, food log, journal, PVT, storage, export
docs/thresholds.md  where every number comes from + open decisions for the team
```

## Design system (60-30-10)

Light, soft-card style built around the ARTEMIS logo blue `#3253DF`:

| Share | Role | Tokens |
|---|---|---|
| 60% | Page background (cool off-white) | `--bg #eef1f6` |
| 30% | White rounded cards, inputs, floating panels | `--surface #ffffff`, `--surface-2 #f6f8fb`, `--line #e4e8ef` |
| 10% | Actions, selection, focus | `--accent #3253df` (logo blue) |

Green / amber / red are reserved for health status only. Font: Plus Jakarta Sans.

**Dark theme:** same 60-30-10 split (deep navy page, raised navy cards, a lighter tint of the logo blue `#8ea4ff` so text stays readable). It follows the system setting by default; the sun/moon button in the top bar switches it and remembers the choice. The logo has white-letter versions for dark mode. Layout: icon sidebar (bottom tab bar on phones), 3D body stage with floating panels, crew card + vitals on the right.

## Integration hooks

```js
window.ingestTelemetryPayload({ onsd: 5.8, sodium_intake: 3200 });   // log readings (optional 2nd arg: timestamp)
window.ingestBackendSnapshot(json);   // diet-spec, mental-health-spec or Mars-spec JSON
window.exportBackendSnapshot();       // diet-spec format + fatigue/sleep/journal blocks
window.exportMarsSnapshot();          // Mars spec v2: body_map_nodes + telemetry_payloads
window.getCrewProfile(); window.setCrewProfile({...});
```

*Not a medical device. Ranges come from the team's research documents. See `docs/thresholds.md`, including the decisions the team still needs to confirm.*

## Credits

3D anatomy: **BodyParts3D, © The Database Center for Life Science**, licensed under [CC Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/) (adult male reference anatomy, simplified with `tools/build-body.mjs`).
