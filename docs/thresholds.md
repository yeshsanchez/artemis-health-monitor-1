# Thresholds: where every number comes from

This file explains how A.R.T.E.M.I.S. decides **Normal / Drift / Critical**, and which team research document each number comes from. The tables at the bottom are generated from `js/metrics.js`, so they always match what the app does.

## How a reading becomes a status

1. Every metric has up to six boundaries, which make up the research's **1–7 bipolar scale**. Level 4 is Normal. Levels 1–3 are too low and Levels 5–7 are too high.
2. Levels map onto the team's **three levels**:

| Level | Name | Team status |
|---|---|---|
| 4 | Normal | **Normal** |
| 3, 5 | Slightly low / high | **Drift** |
| 2, 6 | Low / High | **Drift, marked "high priority"** (the Mars spec calls these "High-Priority Alert") |
| 1, 7 | Very low / Very high | **Critical** |

   To make Levels 2 and 6 Critical instead, change one line in `js/engine.js`: `const CRITICAL_LEVELS = [1, 7];` → `[1, 2, 6, 7]`.

3. **"Must last N days" rules** from the specs are applied on top of the levels:
   - Calories: Critical only after **more than 5 days in a row** in the Critical range. Before that, the reading shows as high-priority Drift with "day X of 6". (Source: diet spec.)
   - Period flow: Critical only when heavy (more than 5 changes a day) for **more than 2 days**. (Source: female health spec.)
4. **One reading per day.** Logging again on the same day replaces that day's value, so the 14 / 30 / 90-day and mission timelines show one point per day.
5. **Forecast:** a straight line fitted through the last 7 readings (minimum 3), projected 7 days ahead. It warns if the line will cross into Drift or Critical.

## Decisions the team should confirm

The research documents disagree in places. Each conflict below lists the choice made and the reason, so the team can change it.

| Topic | Conflict | Choice in the app |
|---|---|---|
| **Are Levels 2 and 6 Critical?** | The Mars spec's mapping table says L2/L6 are "RED / High-Priority Alert". The lunar matrix labels L6 "Caution threshold", and the diet spec puts osmolality 303–310 (Mars L6) in **Yellow**. | Drift + "high priority" flag (one-line switch above). This keeps the team's original behavior and still shows the research's urgency. |
| **Reaction test (PVT) lapses** | Mars spec: Normal < 5%, L6 starts at 13%. Mental health spec and glossary: Normal 5–10%, Yellow 11–15%, Red > 15–20%. | Mental health spec (the domain spec), which the glossary also agrees with: Drift above 10%, Critical above 15%. |
| **HRV** | Mars spec: fixed range 15–75 ms. Mental health spec: drop from your **personal baseline** (15–25% = Yellow, > 30% = Red); high HRV never alarms. | Personal baseline (new profile field, default 45 ms). Drift below 85% of baseline, Critical below 70%. |
| **Sleep hours** | Mars spec: L1 < 4.0, L2 4.0–4.8. Mental health spec: Red < 4.5, Yellow 4.5–5.9, Red > 9.5. | Mental health spec. 7.5–9.5 h is Drift because that range was not covered. |
| **Radiation** | Mars spec: L6 2.6–6.0 and L7 > 200, which leaves 6–200 unassigned. Lunar: L6 2.5–5.0 and L7 > 250, which leaves 5–250 unassigned. | The unassigned range belongs to L6 (high-priority Drift, "go to the storm shelter"). Critical only at the acute solar-storm level (> 200 or > 250). |
| **Cabin CO₂ low** | The prototype alarmed on low cabin CO₂. The glossary says low CO₂ is always safe. The Mars spec has an odd "L3 < 1.5". | No low alarm, following the glossary. (Helmet CO₂ keeps its low levels because the lunar matrix gives them.) |
| **Perchlorate low** | The prototype showed **Yellow** for trace amounts under 1.0 µg/L. | Removed: zero or trace exposure is ideal (glossary). |
| **Gaps between bands** | Sodium 3,500–3,800; menstruating iron 10–12; protein 1.0–1.2 and 1.5–1.8; potassium 2,500–2,800; fluid 1,500–1,600. | Every gap belongs to the band next to Normal (Drift), so every value gets exactly one status. |
| **Vital signs** | The Mars data schema requires heart rate and SpO₂, but no team document gives ranges. | NEWS2 (Royal College of Physicians, 2017), a published hospital early-warning score. Needs team review. |
| **Stress 0–10 and journal tone** | The mental health spec gives Normal (stress 0–3; neutral/positive tone) but no Drift/Critical bands. | Stress uses the same 4–6 / 7–10 split as the team's pain scale. Journal tone: Drift below −0.2, Critical below −0.6. Both are placeholders for the team to confirm. |
| **Sleep stages (deep, REM, awake time)** | Only Normal ranges are given. | Outside Normal = Drift; these never trigger Critical on their own. |
| **Standing heart-rate jump (Mars)** | The glossary groups Levels 1–3 and 5–7 without splitting them. | Drift for 5–15 or 26–30 bpm, high-priority Drift for 31–40, Critical above 40 or below 5. Needs team review. |

## Citation check before submitting

Some citations in the Mars spec v2 don't match its own reference list:
- In the text it cites "Lee et al., JAMA Ophthalmol 2020", but the reference list gives the journal *Eye*.
- In the text it cites "Mader et al., Radiology 2017", but the reference is *Ophthalmology* 2011.
- "Smith et al., Bone 2012" in the text corresponds to *J Bone Miner Res* 2012 in the reference list.
- "Hargens et al. (2018)" and "Aggarwal et al. (2014)" (lunar matrix) are not in any reference list.
- Paloski et al. 2008 is a sensory-motor paper, but it is cited for bone loss.

Every source above should be verified before the submission is final.

## Full table (generated from `js/metrics.js`)

Read "L3 < 12" as "below 12 is Level 3 or lower". `0.38g`, `0.166g` etc. are location-specific overrides. HRV and fluid targets are computed from the profile (HRV baseline, body weight, sex, kidney-stone history), and iron depends on cycle mode: at least 18 mg/day for a natural cycle (Critical below 10), and at most 8 mg/day for suppression or male (Critical above 15).

### Eyes & head

| Metric | Unit | Levels (where it switches) | Source |
|---|---|---|---|
| Eye nerve swelling (ONSD) (`onsd`) | mm | L1 < 4 · L2 < 4.5 · L3 < 5<br>L5 > 6.2 · L6 > 6.4 · L7 > 6.8<br>**0.38g:** L1 < 4.5 · L2 < 4.7 · L3 < 4.8 / L5 > 6 · L6 > 6.2 · L7 > 6.7 | Team glossary & 1–7 guide (ISS section); 0.38g: Team Mars spec v2 (1–7 tables) |
| Eyeball pressure (IOP) (`iop`) | mmHg | L1 < 8 · L2 < 10 · L3 < 12<br>L5 > 24 · L6 > 29 · L7 > 29<br>**0.38g:** L1 < 8 · L2 < 10 · L3 < 12 / L5 > 20 · L6 > 23 · L7 > 28 | Team glossary & 1–7 guide (ISS section); 0.38g: Team Mars spec v2 (1–7 tables) |
| Radiation dose (`rad`) | mGy/day | — (no low alert)<br>L5 > 1.8 · L6 > 2.5 · L7 > 200<br>**0.166g:** — (no low alert) / L5 > 1.8 · L6 > 2.4 · L7 > 250<br>**0.166g_rover:** — (no low alert) / L5 > 1.8 · L6 > 2.4 · L7 > 250 | Team Mars spec v2 (1–7 tables); 0.166g: Team Lunar 1–7 matrix; 0.166g_rover: Team Lunar 1–7 matrix |

### Mind & sleep

| Metric | Unit | Levels (where it switches) | Source |
|---|---|---|---|
| Sleep last night (`sleep`) | hours | L1 < 4.5 · L2 < 4.5 · L3 < 6<br>L5 > 7.5 · L6 > 9.5 · L7 > 9.5 | Team mental health spec (Section 3) |
| Sleep efficiency (`sleep_eff`) | % | L1 < 70 · L2 < 70 · L3 < 85<br>— (no high alert) | Team mental health spec (Section 3) |
| Deep sleep (SWS) (`deep_sleep`) | % of sleep | L1 < −∞ · L2 < −∞ · L3 < 15<br>L5 > 25 · L6 > ∞ · L7 > ∞ | Team mental health spec (Section 3) |
| Dream sleep (REM) (`rem_sleep`) | % of sleep | L1 < −∞ · L2 < −∞ · L3 < 20<br>L5 > 25 · L6 > ∞ · L7 > ∞ | Team mental health spec (Section 3) |
| Awake during the night (`waso`) | min | — (no low alert)<br>L5 > 30 · L6 > ∞ · L7 > ∞ | Team mental health spec (Section 3) |
| Stress recovery (HRV) (`hrv`) | ms | *computed — see notes* | Team mental health spec (Section 3) |
| Reaction test lapses (PVT) (`pvt`) | % slow | — (no low alert)<br>L5 > 10 · L6 > 15 · L7 > 15 | Team mental health spec (Section 3) |
| Sleepiness (KSS) (`kss`) | /9 | — (no low alert)<br>L5 > 4 · L6 > 6 · L7 > 6 | Team mental health spec (Section 3) |
| Stress level (`stress`) | /10 | — (no low alert)<br>L5 > 3 · L6 > 6 · L7 > 6 | Team mental health spec (journal: stress 0–3 normal; higher bands follow the team's 0–10 scale) |
| Journal tone (`journal_sentiment`) | score | L1 < -0.6 · L2 < -0.6 · L3 < -0.2<br>— (no high alert) | Team mental health spec (Section 3) |

### Heart, lungs & air

| Metric | Unit | Levels (where it switches) | Source |
|---|---|---|---|
| Resting heart rate (`heart_rate`) | bpm | L1 < 41 · L2 < 41 · L3 < 51<br>L5 > 90 · L6 > 130 · L7 > 130 | NEWS2 early-warning score (Royal College of Physicians, 2017) |
| Blood oxygen (SpO₂) (`spo2`) | % | L1 < 92 · L2 < 92 · L3 < 96<br>— (no high alert) | NEWS2 early-warning score (Royal College of Physicians, 2017) |
| Breathing rate (`resp_rate`) | breaths/min | L1 < 9 · L2 < 9 · L3 < 12<br>L5 > 20 · L6 > 24 · L7 > 24 | NEWS2 early-warning score (Royal College of Physicians, 2017) |
| Neck vein blood flow (IJV) (`ijv`) | cm/s | L1 < 5 · L2 < 7 · L3 < 10<br>L5 > 25 · L6 > 30 · L7 > 40 | Team Mars spec v2 (1–7 tables) |
| Cabin air CO₂ (`co2`) | mmHg | — (no low alert)<br>L5 > 3 · L6 > 3.5 · L7 > 5<br>**0.38g:** — (no low alert) / L5 > 3.5 · L6 > 4.5 · L7 > 5.5<br>**0g_transit:** — (no low alert) / L5 > 3.5 · L6 > 4.5 · L7 > 5.5 | Team glossary & 1–7 guide (ISS section); 0.38g: Team Mars spec v2 (1–7 tables); 0g_transit: Team Mars spec v2 (1–7 tables) |
| Blood CO₂ (pCO₂) (`blood_co2`) | mmHg | L1 < 30 · L2 < 34 · L3 < 38<br>L5 > 43 · L6 > 48 · L7 > 55 | Team Mars spec v2 (1–7 tables) |
| Standing heart-rate jump (`tilt_hr`) | bpm | L1 < 5 · L2 < 5 · L3 < 16<br>L5 > 25 · L6 > 30 · L7 > 40 | Team glossary & 1–7 guide (Mars section) |
| Moon dust lung stress (8-OHdG) (`dust`) | ng/mg | — (no low alert)<br>L5 > 5 · L6 > 8 · L7 > 12 | Team Lunar 1–7 matrix |
| Body temperature in suit (`temp`) | °C | L1 < 36 · L2 < 36.5 · L3 < 37<br>L5 > 37.8 · L6 > 38.3 · L7 > 38.9 | Team Lunar 1–7 matrix |
| Helmet CO₂ (`emuco2`) | mmHg | L1 < 1 · L2 < 1.5 · L3 < 2<br>L5 > 4 · L6 > 5.9 · L7 > 7.5 | Team Lunar 1–7 matrix |
| Standing dizziness score (`ortho`) | % | L1 < 60 · L2 < 70 · L3 < 80<br>— (no high alert) | Team Lunar 1–7 matrix |

### Food & water

| Metric | Unit | Levels (where it switches) | Source |
|---|---|---|---|
| Calories eaten (% of goal) (`caloric_balance`) | % goal | L1 < 75 · L2 < 75 · L3 < 90<br>L5 > 110 · L6 > 125 · L7 > 125<br>*Critical only after more than 5 days in a row* | Team diet spec (Table 2) |
| Protein (per kg body weight) (`protein_intake`) | g/kg | L1 < 0.8 · L2 < 0.8 · L3 < 1.2<br>L5 > 1.5 · L6 > 2 · L7 > 2 | Team diet spec (Table 2) |
| Carbohydrates (% of calories) (`carbs_pct`) | % kcal | L1 < 35 · L2 < 35 · L3 < 50<br>L5 > 55 · L6 > 70 · L7 > 70 | Team diet spec (Table 2) |
| Healthy fats (% of calories) (`fats_pct`) | % kcal | L1 < 15 · L2 < 15 · L3 < 25<br>L5 > 30 · L6 > 42 · L7 > 42 | Team diet spec (Table 2) |
| Fiber (`dietary_fiber`) | g/day | L1 < 15 · L2 < 15 · L3 < 25<br>L5 > 35 · L6 > 50 · L7 > 50 | Team diet spec (Table 2) |
| Water & drinks (`fluid_intake`) | mL/day | *computed — see notes* | Team diet spec (Table 2) |
| Iron from food (`dietary_iron`) | mg/day | *computed — see notes* | Team diet spec (Table 2) |
| Salt (sodium) (`sodium_intake`) | mg/day | — (no low alert)<br>L5 > 2999 · L6 > 3800 · L7 > 3800 | Team diet spec (Table 2) |
| Potassium (`potassium_intake`) | mg/day | L1 < 2500 · L2 < 2500 · L3 < 3500<br>L5 > 4700 · L6 > 6000 · L7 > 6000 | Team diet spec (Table 2) |
| Magnesium (`magnesium_intake`) | mg/day | L1 < 200 · L2 < 200 · L3 < 300<br>L5 > 400 · L6 > 600 · L7 > 600 | Team diet spec (Table 2) |
| Iodine (thyroid) (`iodine_intake`) | µg/day | L1 < 100 · L2 < 100 · L3 < 150<br>— (no high alert) | Team diet spec (Table 2) |
| Vitamin C (% of target) (`vit_c_pct`) | % target | L1 < 50 · L2 < 50 · L3 < 80<br>— (no high alert) | Team diet spec (Table 2) |

### Bones & kidneys

| Metric | Unit | Levels (where it switches) | Source |
|---|---|---|---|
| Spine stretch (`spine`) | in/EVA | — (no low alert)<br>L5 > 1.5 · L6 > 2 · L7 > 3 | Team Lunar 1–7 matrix |
| Blood hydration (osmolality) (`osmolality`) | mOsm/kg | L1 < 275 · L2 < 280 · L3 < 284<br>L5 > 298 · L6 > 302 · L7 > 310 | Team Mars spec v2 (1–7 tables) |
| Urine concentration (USG) (`usg`) | ratio | L1 < 1.005 · L2 < 1.01 · L3 < 1.015<br>L5 > 1.025 · L6 > 1.028 · L7 > 1.032 | Team Mars spec v2 (1–7 tables) |
| Calcium lost in urine (`calcium`) | mg/24h | L1 < 100 · L2 < 150 · L3 < 250<br>L5 > 400 · L6 > 450 · L7 > 500<br>**0.38g:** L1 < 80 · L2 < 131 · L3 < 200 / L5 > 350 · L6 > 400 · L7 > 480 | Team glossary & 1–7 guide (ISS section); 0.38g: Team Mars spec v2 (1–7 tables) |
| Monthly bone loss (BMD) (`bmd`) | %/mo | L1 < -1.5 · L2 < -1 · L3 < -0.5<br>— (no high alert)<br>**0.38g:** L1 < -1 · L2 < -0.7 · L3 < -0.4 / — (no high alert) | Team glossary & 1–7 guide (ISS section); 0.38g: Team Mars spec v2 (1–7 tables) |
| Mars soil toxin (perchlorate) (`perchlorate`) | µg/L | — (no low alert)<br>L5 > 5 · L6 > 10 · L7 > 25 | Team Mars spec v2 (1–7 tables) |

### Cycle & blood iron

| Metric | Unit | Levels (where it switches) | Source |
|---|---|---|---|
| Missed suppression pills (`pill_missed`) | days in a row | — (no low alert)<br>L5 > 0 · L6 > 2 · L7 > 2 | Team female health spec (Section 3) |
| Breakthrough bleeding (`breakthrough_days`) | days in a row | — (no low alert)<br>L5 > 0 · L6 > 3 · L7 > 3 | Team female health spec (Section 3) |
| Period flow (`menstrual_flow`) | changes/day | — (no low alert)<br>L5 > 3 · L6 > 5 · L7 > 5<br>*Critical only after more than 2 days in a row* | Team female health spec (Section 3) |
| Period cramp pain (`cramping_pain`) | /10 | — (no low alert)<br>L5 > 3 · L6 > 6 · L7 > 6 | Team female health spec (Section 3) |
| Stored iron (ferritin) (`ferritin`) | µg/L | L1 < 20 · L2 < 20 · L3 < 30<br>L5 > 120 · L6 > 200 · L7 > 200 | Team female health spec (Section 3) |
| Blood oxygen carriers (hemoglobin) (`hemoglobin`) | g/dL | L1 < 11 · L2 < 11 · L3 < 12<br>— (no high alert) | Team female health spec (Section 3) |
| Medicine strength (radiation) (`pill_potency`) | % potency | L1 < 80 · L2 < 80 · L3 < 90<br>— (no high alert) | Team female health spec (Section 3) |
| Pelvic comfort & relaxation (`sexual_oxytocin`) | /5 | L1 < 1 · L2 < 1 · L3 < 2<br>— (no high alert) | Team female health spec (Section 3) |
