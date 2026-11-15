/* =============================================================================
   A.R.T.E.M.I.S. — metric catalogue, environments and regions
   -----------------------------------------------------------------------------
   Every metric carries "bands": the boundaries between the seven levels of the
   research's 1–7 bipolar scale (Level 4 = Normal).

     low:  [L1|L2, L2|L3, L3|L4]   value below low[2]  -> Levels 3, 2, 1
     high: [L4|L5, L5|L6, L6|L7]   value above high[0] -> Levels 5, 6, 7

   null means "no alert on that side" (e.g. low cabin CO2 is always safe).
   Levels map onto the team's three tiers (Normal / Drift / Critical) in
   engine.js -> CRITICAL_LEVELS. Every number below is traced to its source in
   docs/thresholds.md.
   ========================================================================== */

const REGIONS = [
    { id: 'NEURO/OCULAR',    key: 'neuro',  label: 'Eyes & head',          organ: 'Eyes and optic nerve' },
    { id: 'MENTAL/SLEEP',    key: 'mental', label: 'Mind & sleep',         organ: 'Brain' },
    { id: 'CARDIO/AIR',      key: 'cardio', label: 'Heart, lungs & air',   organ: 'Heart and lungs' },
    { id: 'DIET/SUSTENANCE', key: 'diet',   label: 'Food & water',         organ: 'Stomach' },
    { id: 'BONE/HYDRATION',  key: 'bone',   label: 'Bones & kidneys',      organ: 'Skeleton and kidneys' },
    { id: 'GYN/CYCLE',       key: 'gyn',    label: 'Cycle & blood iron',   organ: 'Pelvis' }
];
const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));

/* Kit tags: surgeon (live Earth doctor), ultrasound, lbnp, ared, lab, scrubbers,
   shelter, ki, ors, meds */
const ENVIRONMENTS = {
    '0g_station': {
        label: 'ISS microgravity', short: 'ISS · 0g', gravity: '0g', autonomous: false,
        delay: { text: 'Under 1 s', min: 0, adjustable: false },
        kit: ['surgeon', 'ultrasound', 'lbnp', 'ared', 'lab', 'scrubbers', 'shelter', 'ors', 'meds'],
        kitLabel: 'ISS full med bay: ultrasound, gym rig (ARED), leg vacuum (LBNP), air scrubbers, live flight surgeon',
        context: [
            ['Zero gravity', 'Body fluid floats toward your head (eye pressure) and bones shed calcium (about −0.5% a month). Keep salt under 3,000 mg a day.'],
            ['Cabin air', '21–24 °C, CO₂ 1.5–3.0 mmHg. A flight surgeon on Earth is on a live link.']
        ]
    },
    '0g_transit': {
        label: 'Deep-space transit', short: 'Transit · 0g', gravity: '0g', autonomous: true,
        delay: { text: '', min: 14, adjustable: true },
        kit: ['ultrasound', 'lbnp', 'ared', 'lab', 'scrubbers', 'shelter', 'ors', 'meds'],
        kitLabel: 'Transit med bay: leg vacuum (LBNP), ultrasound, gym rig, shielded medicine stock, storm shelter',
        context: [
            ['Deep space (0g)', 'Years of cosmic radiation slowly weaken stored vitamins and pills. Outside Earth\'s magnetic shield, solar storms need the storm shelter.'],
            ['Radio delay', 'Messages take minutes to reach Earth, so the app guides you on its own (self-guided mode).']
        ]
    },
    '0.166g': {
        label: 'Moon base habitat', short: 'Moon base · 0.166g', gravity: '0.166g', autonomous: false,
        delay: { text: '1.3 s', min: 0, adjustable: false },
        kit: ['surgeon', 'lab', 'ared', 'scrubbers', 'shelter', 'ors', 'meds'],
        kitLabel: 'Lunar habitat lab: dust (urine) analyzer, height bar, blood reader, storm shelter',
        context: [
            ['Moon gravity (1/6 g)', 'Your spine stretches and walks are hard work: 8-hour moonwalks burn 200–450 kcal an hour, so eat extra carbs and drink more.'],
            ['Dust & suit', 'Moon dust is sharp like glass. The airlock cleans it off; the cooling suit keeps you at 37.0–37.8 °C.']
        ]
    },
    '0.166g_rover': {
        label: 'Moon rover / EVA', short: 'Rover · 0.166g', gravity: '0.166g', autonomous: false,
        delay: { text: '1.3 s', min: 0, adjustable: false },
        kit: ['surgeon', 'ors', 'meds'],
        kitLabel: 'Rover basic kit: radiation badge, suit readouts, blood-pressure cuff, ORS packets',
        context: [
            ['Basic kit only', 'The habitat lab and height bar stay at base, so only suit, radiation, blood-pressure, hydration and wearable sensors work here.'],
            ['Suit comfort', 'A tight hip harness can make period cramps worse. On a Critical alert, head back to base.']
        ]
    },
    '0.38g': {
        label: 'Mars habitat', short: 'Mars · 0.38g', gravity: '0.38g', autonomous: true,
        delay: { text: '', min: 18, adjustable: true },
        kit: ['ultrasound', 'lbnp', 'ared', 'lab', 'scrubbers', 'shelter', 'ki', 'ors', 'meds'],
        kitLabel: 'Mars autonomous lab: blood & urine reader, ultrasound, leg vacuum, shielded stock, KI tablets',
        context: [
            ['Mars gravity & soil (0.38g)', 'Slopes make work harder. Toxic soil salts (perchlorates, above 5 µg/L in urine) block the thyroid from using iodine.'],
            ['Cold & delay', '−60 °C outside burns more calories and can worsen cramps. Earth is 4–22 minutes away each way, so the app runs self-guided.']
        ]
    }
};

/* Metric lists per location (physical / environment-specific). */
const ENV_METRICS = {
    '0g_station':   ['onsd', 'iop', 'ijv', 'co2', 'blood_co2', 'calcium', 'bmd', 'osmolality', 'usg'],
    '0g_transit':   ['onsd', 'iop', 'ijv', 'rad', 'co2', 'blood_co2', 'calcium', 'bmd', 'osmolality', 'usg'],
    '0.166g':       ['rad', 'dust', 'temp', 'emuco2', 'ortho', 'spine', 'blood_co2', 'calcium', 'osmolality', 'usg'],
    '0.166g_rover': ['rad', 'temp', 'emuco2', 'ortho', 'osmolality', 'usg'],
    '0.38g':        ['onsd', 'iop', 'ijv', 'rad', 'co2', 'blood_co2', 'perchlorate', 'tilt_hr', 'calcium', 'bmd', 'osmolality', 'usg']
};
/* Shared everywhere: vital signs, mind & sleep, food & water. */
const VITAL_METRICS = ['heart_rate', 'spo2', 'resp_rate'];
const MIND_METRICS  = ['sleep', 'sleep_eff', 'deep_sleep', 'rem_sleep', 'waso', 'hrv', 'pvt', 'kss', 'stress', 'journal_sentiment'];
const DIET_METRICS  = ['caloric_balance', 'protein_intake', 'carbs_pct', 'fats_pct', 'dietary_fiber', 'fluid_intake',
                       'dietary_iron', 'sodium_intake', 'potassium_intake', 'magnesium_intake', 'iodine_intake', 'vit_c_pct'];
const GYN_METRICS = {
    FEMALE_CYCLE:      ['menstrual_flow', 'cramping_pain', 'ferritin', 'hemoglobin', 'sexual_oxytocin'],
    FEMALE_SUPPRESSED: ['pill_missed', 'breakthrough_days', 'cramping_pain', 'ferritin', 'hemoglobin', 'pill_potency', 'sexual_oxytocin'],
    MALE: []
};

const SRC = {
    mars:    'Team Mars spec v2 (1–7 tables)',
    lunar:   'Team Lunar 1–7 matrix',
    gloss:   'Team glossary & 1–7 guide (ISS section)',
    diet:    'Team diet spec (Table 2)',
    gyn:     'Team female health spec (Section 3)',
    mental:  'Team mental health spec (Section 3)',
    news2:   'NEWS2 early-warning score (Royal College of Physicians, 2017)'
};

const NONE = null;
const INF = Infinity;

/* m(): small constructor so every metric has the same shape. */
const m = (id, o) => ({
    id, decimals: 1, discrete: false, envBands: null, bandsFn: null, persist: null, diet: {}, actions: {},
    ...o, history: [], stale: false
});

const METRICS = {
    /* ------------------------------------------------------------ EYES & HEAD */
    onsd: m('onsd', {
        name: 'Eye nerve swelling (ONSD)', unit: 'mm', cat: 'NEURO/OCULAR', method: 'eye_ultrasound',
        bands: { low: [4.0, 4.5, 5.0], high: [6.2, 6.4, 6.8] }, src: SRC.gloss,
        envBands: { '0.38g': { low: [4.5, 4.7, 4.8], high: [6.0, 6.2, 6.7], src: SRC.mars } },
        definition: 'In zero gravity, fluid floats up into your head and presses on the nerve behind your eye. Too much swelling can blur your vision for good (SANS).',
        how: ['Put a little gel on your closed eyelid.', 'Rest the ultrasound probe gently on the lid until the screen shows a green lock.'],
        actions: { low: 'Unusually narrow reading — re-check the probe position and calibration, then drink water.', high: 'Use the leg vacuum (LBNP) at −25 to −45 mmHg for 45 minutes a day to pull fluid back down to your legs.' },
        diet: { low: 'Drink 500 mL of water.', high: 'Keep salt under 3,000 mg a day — salt holds fluid in your head.' }
    }),
    iop: m('iop', {
        name: 'Eyeball pressure (IOP)', unit: 'mmHg', cat: 'NEURO/OCULAR', method: 'tonometer', decimals: 0,
        bands: { low: [8, 10, 12], high: [24, 29, 29] }, src: SRC.gloss,
        envBands: { '0.38g': { low: [8, 10, 12], high: [20, 23, 28], src: SRC.mars } },
        definition: 'The fluid pressure inside your eyeball. Normal is 12–24 mmHg in zero gravity and 12–20 on Mars. Too high pushes on the back of the eye; too low makes the eye soft.',
        how: ['Hold the handheld tonometer straight in front of your eye.', 'Let the tip touch the eye briefly when the device prompts you.'],
        actions: { low: 'Low eye pressure (hypotony) — tell the Flight Surgeon or Crew Medical Officer today.', high: 'Start a leg vacuum (LBNP) session and tell the Flight Surgeon. Critical: possible SANS pressure spike.' },
        diet: { low: 'Drink water steadily through the day.', high: 'Keep salt under 3,000 mg a day.' }
    }),

    /* -------------------------------------------------- HEART, LUNGS & AIR */
    heart_rate: m('heart_rate', {
        name: 'Resting heart rate', unit: 'bpm', cat: 'CARDIO/AIR', method: 'chest_strap', decimals: 0,
        bands: { low: [41, 41, 51], high: [90, 130, 130] }, src: SRC.news2,
        definition: 'Beats per minute while resting. The Mars spec lists heart rate as required live data; these limits come from the NEWS2 hospital early-warning score.',
        how: ['Wear the chest strap or watch.', 'Sit still for 5 minutes, then let it sync.'],
        actions: { low: 'Slow heart rate — sit or lie down, check for dizziness, and tell the Crew Medical Officer.', high: 'Fast resting heart rate — stop exertion, rest 15 minutes and re-check. Critical: alert the Crew Medical Officer.' },
        diet: { high: 'Drink 500 mL of water with an electrolyte packet (ORS).' }
    }),
    spo2: m('spo2', {
        name: 'Blood oxygen (SpO₂)', unit: '%', cat: 'CARDIO/AIR', method: 'finger_clip', decimals: 0,
        bands: { low: [92, 92, 96], high: NONE }, src: SRC.news2,
        definition: 'How full your blood is with oxygen. Below 92% means your body is short of oxygen — check the air supply first.',
        how: ['Clip the pulse oximeter onto a warm fingertip.', 'Keep your hand still for 30 seconds.'],
        actions: { low: 'Check cabin or suit oxygen and CO₂ right away. Critical: put on an oxygen mask and alert the crew.' },
        diet: {}
    }),
    resp_rate: m('resp_rate', {
        name: 'Breathing rate', unit: 'breaths/min', cat: 'CARDIO/AIR', method: 'chest_strap', decimals: 0,
        bands: { low: [9, 9, 12], high: [20, 24, 24] }, src: SRC.news2,
        definition: 'Breaths per minute at rest. Fast breathing can mean stress, high CO₂ or illness; very slow breathing can mean you are over-sedated.',
        how: ['Wear the chest strap.', 'Sit quietly for 1 minute while it counts.'],
        actions: { low: 'Very slow breathing — check alertness and any sleep medicine taken. Alert the Crew Medical Officer.', high: 'Breathe slowly: in for 4, hold 4, out for 6. Check cabin CO₂. Critical: alert the crew.' },
        diet: {}
    }),
    ijv: m('ijv', {
        name: 'Neck vein blood flow (IJV)', unit: 'cm/s', cat: 'CARDIO/AIR', method: 'neck_ultrasound', decimals: 0,
        bands: { low: [5, 7, 10], high: [25, 30, 40] }, src: SRC.mars,
        definition: 'How fast blood drains from your head through the big neck vein. Slow flow (under 7 cm/s) can let a clot form.',
        how: ['Put gel on the side of your neck.', 'Place the flat ultrasound probe over the vein and hold still.'],
        actions: { low: 'Run a Doppler ultrasound check for a clot in the left neck vein now. If a clot is seen, follow the Flight Surgeon\'s blood-thinner protocol.', high: 'Use the leg vacuum (LBNP) to ease fluid in your head.' },
        diet: {}
    }),
    co2: m('co2', {
        name: 'Cabin air CO₂', unit: 'mmHg', cat: 'CARDIO/AIR', method: 'wall_monitor',
        bands: { low: NONE, high: [3.0, 3.5, 5.0] }, src: SRC.gloss,
        envBands: {
            '0.38g':      { low: NONE, high: [3.5, 4.5, 5.5], src: SRC.mars },
            '0g_transit': { low: NONE, high: [3.5, 4.5, 5.5], src: SRC.mars }
        },
        definition: 'Stale breathed-out air building up in the cabin. It causes headaches and foggy thinking. Low cabin CO₂ is always safe, so it never alarms.',
        how: ['Read the CO₂ number on the cabin wall air monitor.'],
        actions: { high: 'Switch on the backup air scrubbers and check airflow. Critical: put on portable oxygen masks and leave the affected module.' },
        diet: {}
    }),
    blood_co2: m('blood_co2', {
        name: 'Blood CO₂ (pCO₂)', unit: 'mmHg', cat: 'CARDIO/AIR', method: 'finger_prick', decimals: 0,
        bands: { low: [30, 34, 38], high: [43, 48, 55] }, src: SRC.mars,
        definition: 'Carbon dioxide dissolved in your blood. Low usually means panic or fast breathing; high means CO₂ is building up from the air.',
        how: ['Prick a fingertip and touch the drop to the test strip.', 'Insert the strip into the blood gas reader.'],
        actions: { low: 'Guided slow breathing: 6 breaths a minute for 5 minutes to bring CO₂ back up.', high: 'Turn on the backup CO₂ scrubbers and check cabin airflow right away.' },
        diet: {}
    }),
    tilt_hr: m('tilt_hr', {
        name: 'Standing heart-rate jump', unit: 'bpm', cat: 'CARDIO/AIR', method: 'bp_cuff', decimals: 0,
        bands: { low: [5, 5, 16], high: [25, 30, 40] }, src: 'Team glossary & 1–7 guide (Mars section)',
        definition: 'How much your heart speeds up when you stand. In Mars gravity a jump of 16–25 bpm is normal; much more means your heart is struggling to keep blood in your head.',
        how: ['Lie flat for 5 minutes and note your heart rate.', 'Stand up and read your heart rate again after 1 minute.'],
        actions: { low: 'Your heart barely reacted — repeat the test, and tell the Crew Medical Officer if you feel faint.', high: 'Fainting risk: wear compression leggings, stand up slowly, and do not start an EVA until it settles.' },
        diet: { high: 'Drink an ORS electrolyte packet with 500 mL of water.' }
    }),
    rad: m('rad', {
        name: 'Radiation dose', unit: 'mGy/day', cat: 'NEURO/OCULAR', method: 'rad_badge', decimals: 2,
        bands: { low: NONE, high: [1.8, 2.5, 200] }, src: SRC.mars,
        envBands: {
            '0.166g':       { low: NONE, high: [1.8, 2.4, 250], src: SRC.lunar },
            '0.166g_rover': { low: NONE, high: [1.8, 2.4, 250], src: SRC.lunar }
        },
        definition: 'Your daily dose of space radiation. Normal background is 0.4–1.8 mGy a day. A sudden jump means a solar storm (SPE).',
        how: ['Clip the radiation badge to your outer suit pocket, facing out.'],
        actions: { high: 'Drift: limit time outside and stay near shielding. High priority (above 2.5): a solar storm is likely — move into the storm shelter now and stay until the alert clears.' },
        diet: { high: 'Take the approved antioxidant supplements (vitamins C and E).' }
    }),
    dust: m('dust', {
        name: 'Moon dust lung stress (8-OHdG)', unit: 'ng/mg', cat: 'CARDIO/AIR', method: 'urine_lab',
        bands: { low: NONE, high: [5.0, 8.0, 12.0] }, src: SRC.lunar,
        definition: 'A urine marker that rises when sharp Moon dust irritates your lungs.',
        how: ['Fill a urine pouch.', 'Load it into the habitat lab analyzer and wait 5 minutes.'],
        actions: { high: 'Run the airlock dust cleaning and HEPA vacuums. Critical: report breathing symptoms to the Crew Medical Officer.' },
        diet: { high: 'Take antioxidant vitamins C and E.' }
    }),
    temp: m('temp', {
        name: 'Body temperature in suit', unit: '°C', cat: 'CARDIO/AIR', method: 'suit_display',
        bands: { low: [36.0, 36.5, 37.0], high: [37.8, 38.3, 38.9] }, src: SRC.lunar,
        definition: 'Your core temperature inside the cooling suit during moonwalks. Normal working range is 37.0–37.8 °C.',
        how: ['Plug the cooling garment (LCVG) line into the suit port.', 'Read the temperature on your wrist display.'],
        actions: { low: 'Turn the suit heating up and reduce cooling flow.', high: 'Stop work and turn cooling to maximum. Critical (39 °C or more): end the moonwalk.' },
        diet: { low: 'Drink something warm.', high: 'Drink chilled water now.' }
    }),
    emuco2: m('emuco2', {
        name: 'Helmet CO₂', unit: 'mmHg', cat: 'CARDIO/AIR', method: 'suit_display',
        bands: { low: [1.0, 1.5, 2.0], high: [4.0, 5.9, 7.5] }, src: SRC.lunar,
        definition: 'Checks the suit scrubber is clearing your breathed-out CO₂ inside the helmet.',
        how: ['Read the CO₂ number on the suit chest display.'],
        actions: { low: 'Reading looks too low — check the suit CO₂ sensor calibration.', high: 'CO₂ is building up in your helmet. Slow down and head back. Critical: end the EVA now and purge the suit.' },
        diet: {}
    }),
    ortho: m('ortho', {
        name: 'Standing dizziness score', unit: '%', cat: 'CARDIO/AIR', method: 'bp_cuff', decimals: 0,
        bands: { low: [60, 70, 80], high: NONE }, src: SRC.lunar,
        definition: 'How steady your blood pressure stays when you stand up in Moon gravity. 80–100% is healthy.',
        how: ['Lie flat for 5 minutes.', 'Stand up and record the arm-cuff stability score.'],
        actions: { low: 'Fainting risk: wear compression leggings and stand up slowly.' },
        diet: { low: 'Drink an ORS electrolyte packet.' }
    }),

    /* ---------------------------------------------------------- BONES & KIDNEYS */
    spine: m('spine', {
        name: 'Spine stretch', unit: 'in/EVA', cat: 'BONE/HYDRATION', method: 'height_bar',
        bands: { low: NONE, high: [1.5, 2.0, 3.0] }, src: SRC.lunar,
        definition: 'In Moon gravity your spine stretches taller. A little (0.5–1.5 in) is normal; more can pinch nerves.',
        how: ['After taking off your suit, stand against the habitat height bar.'],
        actions: { high: 'Avoid heavy bending and lifting; wear the compression harness. Critical: report nerve pain or numbness.' },
        diet: {}
    }),
    osmolality: m('osmolality', {
        name: 'Blood hydration (osmolality)', unit: 'mOsm/kg', cat: 'BONE/HYDRATION', method: 'finger_prick', decimals: 0,
        bands: { low: [275, 280, 284], high: [298, 302, 310] }, src: SRC.mars,
        definition: 'How concentrated your blood is. High means you are dehydrated; low means too much plain water (risky for the brain).',
        how: ['Touch a finger-prick blood drop to the strip.', 'Insert it into the blood reader.'],
        actions: { low: 'Too much plain water: cut back and take salt (sodium chloride) tablets.', high: 'Dehydrated: drink an ORS packet with 500 mL of water before any EVA or hard work.' },
        diet: { low: 'Restrict plain water; take salt tablets.', high: 'Drink an ORS packet with 500 mL of water.' }
    }),
    usg: m('usg', {
        name: 'Urine concentration (USG)', unit: 'ratio', cat: 'BONE/HYDRATION', method: 'urine_strip', decimals: 3,
        bands: { low: [1.005, 1.010, 1.015], high: [1.025, 1.028, 1.032] }, src: SRC.mars,
        definition: 'How heavy your urine is compared with water. 1.015–1.025 is normal; higher means dehydrated.',
        how: ['Dip a urine test strip into the catch cup.', 'Slide it into the optical reader.'],
        actions: { low: 'Urine very diluted — cut back on plain water.', high: 'Dehydrated: drink 500 mL of water with ORS now.' },
        diet: { low: 'Take electrolyte tablets.', high: 'Drink 500 mL of water with an ORS packet.' }
    }),
    calcium: m('calcium', {
        name: 'Calcium lost in urine', unit: 'mg/24h', cat: 'BONE/HYDRATION', method: 'urine_24h', decimals: 0,
        bands: { low: [100, 150, 250], high: [400, 450, 500] }, src: SRC.gloss,
        envBands: { '0.38g': { low: [80, 131, 200], high: [350, 400, 480], src: SRC.mars } },
        definition: 'Calcium leaving your bones each day through urine. Normal is 250–400 mg in zero gravity and 200–350 on Mars. High levels cause kidney stones.',
        how: ['Collect all your urine for 24 hours.', 'Inject 10 mL into the chemistry analyzer.'],
        actions: { low: 'Unusually low — check how well you are absorbing calcium from food.', high: 'Raise gym (ARED) lifting loads by 15% and keep salt under 3,000 mg a day.' },
        diet: { low: 'Add calcium-rich food.', high: 'Weekly Alendronate, daily potassium citrate and vitamin D3; keep protein at or under 1.5 g/kg.' }
    }),
    bmd: m('bmd', {
        name: 'Monthly bone loss (BMD)', unit: '%/mo', cat: 'BONE/HYDRATION', method: 'bone_scanner', decimals: 2,
        bands: { low: [-1.5, -1.0, -0.5], high: NONE }, src: SRC.gloss,
        envBands: { '0.38g': { low: [-1.0, -0.7, -0.4], high: NONE, src: SRC.mars } },
        definition: 'How fast your bones are thinning each month. Up to −0.5% is expected in zero gravity (−0.4% on Mars). Keeping or gaining bone never alarms.',
        how: ['Place your forearm or heel in the portable bone scanner for 60 seconds.'],
        actions: { low: 'Bones are thinning faster than expected. Raise gym (ARED) resistance by 15% and add flywheel training 5 days a week.' },
        diet: { low: 'Weekly Alendronate with daily potassium citrate and vitamin D3.' }
    }),
    perchlorate: m('perchlorate', {
        name: 'Mars soil toxin (perchlorate)', unit: 'µg/L', cat: 'BONE/HYDRATION', method: 'urine_lab',
        bands: { low: NONE, high: [5.0, 10.0, 25.0] }, src: SRC.mars,
        definition: 'Toxic salts from Martian soil found in your urine. They stop your thyroid from using iodine. Zero or trace amounts are ideal.',
        how: ['After an EVA, fill a urine vial.', 'Run the soil-toxin test on the mass spectrometer.'],
        actions: { high: 'Run full airlock dust cleaning and HEPA vacuums. Critical (above 25 µg/L): saline nasal rinse and potassium iodide (KI) per protocol.' },
        diet: { high: 'Get at least 150 µg of iodine a day.' }
    }),

    /* ------------------------------------------------------------ MIND & SLEEP */
    sleep: m('sleep', {
        name: 'Sleep last night', unit: 'hours', cat: 'MENTAL/SLEEP', method: 'watch',
        bands: { low: [4.5, 4.5, 6.0], high: [7.5, 9.5, 9.5] }, src: SRC.mental,
        definition: 'Total sleep in the last 24 hours. 6–7.5 hours is the mission target. Very long sleep can be a sign of illness or low mood.',
        how: ['Wear the sleep watch in bed; it syncs when you wake up.', 'Or enter it in the Mind & sleep check-in.'],
        actions: { low: 'Schedule a recovery sleep block tonight; avoid piloting or robotics if you feel foggy. Critical: tell the Flight Surgeon.', high: 'Long sleep can mean illness or low mood. Critical (over 9.5 h): talk to the Flight Surgeon.' },
        diet: { low: 'Caffeine (100 mg) only early in your work shift.' }
    }),
    sleep_eff: m('sleep_eff', {
        name: 'Sleep efficiency', unit: '%', cat: 'MENTAL/SLEEP', method: 'watch', decimals: 0,
        bands: { low: [70, 70, 85], high: NONE }, src: SRC.mental,
        definition: 'Time actually asleep divided by time in bed. 85% or more is good sleep.',
        how: ['Comes from the sleep watch automatically.'],
        actions: { low: 'Morning bright light, a fixed bedtime and a dark, quiet sleep station. Critical: talk to the Flight Surgeon.' },
        diet: {}
    }),
    deep_sleep: m('deep_sleep', {
        name: 'Deep sleep (SWS)', unit: '% of sleep', cat: 'MENTAL/SLEEP', method: 'watch', decimals: 0,
        bands: { low: [-INF, -INF, 15], high: [25, INF, INF] }, src: SRC.mental,
        definition: 'Share of the night in deep, body-repairing sleep. 15–25% is normal. Only flags Drift — it never triggers Critical on its own.',
        how: ['Comes from the sleep watch automatically.'],
        actions: { low: 'Avoid hard exercise and screens in the last hour before sleep.', high: 'Usually harmless — often catch-up sleep after a short night.' },
        diet: {}
    }),
    rem_sleep: m('rem_sleep', {
        name: 'Dream sleep (REM)', unit: '% of sleep', cat: 'MENTAL/SLEEP', method: 'watch', decimals: 0,
        bands: { low: [-INF, -INF, 20], high: [25, INF, INF] }, src: SRC.mental,
        definition: 'Share of the night in dream sleep, which helps memory and mood. 20–25% is normal. Only flags Drift.',
        how: ['Comes from the sleep watch automatically.'],
        actions: { low: 'Keep a steady wake time and avoid sleep aids unless prescribed.', high: 'Usually harmless — often follows a short night.' },
        diet: {}
    }),
    waso: m('waso', {
        name: 'Awake during the night', unit: 'min', cat: 'MENTAL/SLEEP', method: 'watch', decimals: 0,
        bands: { low: NONE, high: [30, INF, INF] }, src: SRC.mental,
        definition: 'Minutes spent awake after first falling asleep (WASO). Under 30 minutes is normal. Only flags Drift.',
        how: ['Comes from the sleep watch automatically.'],
        actions: { high: 'Check noise and light at your sleep station; use earplugs and an eye mask.' },
        diet: {}
    }),
    hrv: m('hrv', {
        name: 'Stress recovery (HRV)', unit: 'ms', cat: 'MENTAL/SLEEP', method: 'chest_strap', decimals: 0,
        bands: { low: [30, 30, 38], high: NONE }, src: SRC.mental,
        bandsFn: (ctx) => {
            const b = ctx.profile.hrvBaseline || 45;
            return { low: [+(b * 0.70).toFixed(1), +(b * 0.70).toFixed(1), +(b * 0.85).toFixed(1)], high: NONE };
        },
        definition: 'Tiny changes in time between heartbeats (RMSSD). Compared with your own baseline from your profile: a drop of 15% or more means your body is under stress; over 30% means exhaustion.',
        how: ['Wear the chest strap or watch.', 'Rest for 5 minutes before the reading.'],
        actions: { low: 'Skip hard workouts today and rest. Critical (over 30% below your baseline): mandatory rest and a breathing biofeedback session.' },
        diet: {}
    }),
    pvt: m('pvt', {
        name: 'Reaction test lapses (PVT)', unit: '% slow', cat: 'MENTAL/SLEEP', method: 'tablet_test', decimals: 0,
        bands: { low: NONE, high: [10, 15, 15] }, src: SRC.mental,
        definition: 'Share of taps slower than 500 ms in the reaction test. Up to 10% is normal on a busy mission. More means hidden tiredness.',
        how: ['Open the Reaction test in Today\'s check-in.', 'Tap as fast as you can each time the box turns amber.'],
        actions: { high: 'Drift: take a 20-minute nap and adjust your schedule. Critical: hand off piloting, robotics and EVA airlock work until you have slept.' },
        diet: { high: 'Caffeine (100 mg) only within your active shift.' }
    }),
    kss: m('kss', {
        name: 'Sleepiness (KSS)', unit: '/9', cat: 'MENTAL/SLEEP', method: 'checkin', decimals: 0, discrete: true,
        bands: { low: NONE, high: [4, 6, 6] }, src: SRC.mental,
        definition: 'How sleepy you feel, from 1 (very alert) to 9 (fighting sleep) — the Karolinska Sleepiness Scale.',
        how: ['Rate it in the Mind & sleep check-in.'],
        actions: { high: 'Drift (5–6): 20-minute power nap and a lighter schedule. Critical (7–9): no docking, robotics or EVA work until rested.' },
        diet: {}
    }),
    stress: m('stress', {
        name: 'Stress level', unit: '/10', cat: 'MENTAL/SLEEP', method: 'checkin', decimals: 0, discrete: true,
        bands: { low: NONE, high: [3, 6, 6] }, src: 'Team mental health spec (journal: stress 0–3 normal; higher bands follow the team\'s 0–10 scale)',
        definition: 'How stressed you feel today, from 0 (calm) to 10 (overwhelmed).',
        how: ['Rate it in the Mind & sleep check-in.'],
        actions: { high: 'Try a 2-minute coping exercise (shown below). Critical: talk to the Crew Medical Officer; a private Flight Surgeon call can be booked.' },
        diet: {}
    }),
    journal_sentiment: m('journal_sentiment', {
        name: 'Journal tone', unit: 'score', cat: 'MENTAL/SLEEP', method: 'journal', decimals: 2,
        bands: { low: [-0.6, -0.6, -0.2], high: NONE }, src: SRC.mental,
        definition: 'A simple on-device word score of your journal entry, from −1 (very negative) to +1 (positive). It is a prompt to check in, not a diagnosis. Your words never leave the device unless you choose to share.',
        how: ['Write a few lines in the journal (Today panel).', 'Pick Private or Share with flight surgeon, then save.'],
        actions: { low: 'Try a short coping exercise (CBT). Critical: reach out to a crewmate or the Crew Medical Officer today.' },
        diet: {}
    }),

    /* ------------------------------------------------------------ FOOD & WATER */
    caloric_balance: m('caloric_balance', {
        name: 'Calories eaten (% of goal)', unit: '% goal', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [75, 75, 90], high: [110, 125, 125] }, src: SRC.diet,
        persist: { critical: 6, text: 'more than 5 days in a row' },
        definition: 'Food calories eaten compared with today\'s total burn (resting + gym + spacewalk). 90–110% is on target.',
        how: ['Log meals in the Food log (scan or pick each pouch).', 'Slide the portion bar to how much you ate.'],
        actions: { low: 'Eat an extra snack pouch today. Critical (over 25% short for more than 5 days): add a high-protein, high-carb meal every day.', high: 'Trim snacks to match today\'s exercise.' },
        diet: { low: 'Add a 350–500 kcal pouch.', high: 'Trim snack calories.' }
    }),
    protein_intake: m('protein_intake', {
        name: 'Protein (per kg body weight)', unit: 'g/kg', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 2,
        bands: { low: [0.8, 0.8, 1.2], high: [1.5, 2.0, 2.0] }, src: SRC.diet,
        definition: 'Protein rebuilds muscle. Aim for 1.2–1.5 g per kg of body weight. Over 2.0 g/kg pulls calcium out of bones into urine.',
        how: ['Worked out automatically from your food log.'],
        actions: { low: 'Add a high-protein entrée or shake.', high: 'Too much protein sheds bone calcium into your kidneys — cut back.' },
        diet: { low: 'Aim for 1.2–1.5 g/kg a day.', high: 'Keep protein at or under 1.5 g/kg and drink more water.' }
    }),
    carbs_pct: m('carbs_pct', {
        name: 'Carbohydrates (% of calories)', unit: '% kcal', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [35, 35, 50], high: [55, 70, 70] }, src: SRC.diet,
        definition: 'Quick energy for your brain and for long moon or Mars walks. Aim for 50–55% of calories.',
        how: ['Worked out automatically from your food log.'],
        actions: { low: 'Critical (under 35%): low blood sugar risk on EVA — take a fast carb gel first.', high: 'Balance with more protein and healthy fats.' },
        diet: { low: 'Aim for 50–55% of calories from carbs.', high: 'Swap some carbs for protein or fats.' }
    }),
    fats_pct: m('fats_pct', {
        name: 'Healthy fats (% of calories)', unit: '% kcal', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [15, 15, 25], high: [30, 42, 42] }, src: SRC.diet,
        definition: 'Fats keep hormones steady and help you absorb vitamin D3. Aim for 25–30% of calories.',
        how: ['Worked out automatically from your food log.'],
        actions: { low: 'Critical (under 15%): your body cannot absorb vitamin D3 well — add nuts or peanut butter.', high: 'Trim added oils and fats.' },
        diet: { low: 'Aim for 25–30% of calories from fats.', high: 'Reduce added oils.' }
    }),
    dietary_fiber: m('dietary_fiber', {
        name: 'Fiber', unit: 'g/day', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [15, 15, 25], high: [35, 50, 50] }, src: SRC.diet,
        definition: 'Keeps digestion moving in low gravity. Aim for 25–35 g a day.',
        how: ['Worked out automatically from your food log.'],
        actions: { low: 'Add a fruit or grain pouch and extra water. Critical: constipation risk.', high: 'Drink extra water.' },
        diet: { low: 'Aim for 25–35 g a day plus 300 mL of water.', high: 'Drink extra water.' }
    }),
    fluid_intake: m('fluid_intake', {
        name: 'Water & drinks', unit: 'mL/day', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [1500, 1500, 2100], high: NONE }, src: SRC.diet,
        bandsFn: (ctx) => ({ low: [1500, 1500, ctx.targets.fluidTargetMl], high: NONE }),
        definition: 'Everything you drank today. Protects blood pressure and flushes your kidneys to stop stones. Your target comes from your profile.',
        how: ['Synced from the water dispenser, or tap the drink buttons in the Food log.'],
        actions: { low: 'Early dehydration — drink steadily. Critical (under 1,500 mL): drink 500 mL of water with electrolytes now.' },
        diet: { low: 'Drink 500 mL of water with an electrolyte packet now.' }
    }),
    dietary_iron: m('dietary_iron', {
        name: 'Iron from food', unit: 'mg/day', cat: 'DIET/SUSTENANCE', method: 'food_scan',
        bands: { low: NONE, high: [8, 15, 15] }, src: SRC.diet,
        bandsFn: (ctx) => ctx.sexMode === 'FEMALE_CYCLE'
            ? { low: [10, 10, 18], high: NONE }
            : { low: NONE, high: [8, 15, 15] },
        definition: 'Crew who have periods need at least 18 mg a day. Men and crew on cycle suppression must stay at or under 8 mg — extra iron builds up in space (neocytolysis) and stresses organs.',
        how: ['Worked out automatically from your food log.'],
        actions: { low: 'Too little iron for active periods — add an iron-rich meal or the iron pill.', high: 'Too much iron (over the 8 mg cap). Switch to low-iron meals. Critical: over 15 mg.' },
        diet: { low: 'Aim for 18 mg a day, eaten with vitamin C.', high: 'Keep iron at or under 8 mg a day.' }
    }),
    sodium_intake: m('sodium_intake', {
        name: 'Salt (sodium)', unit: 'mg/day', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: NONE, high: [2999, 3800, 3800] }, src: SRC.diet,
        definition: 'Too much salt traps fluid in your head (eye pressure) and pushes calcium into urine (kidney stones). Keep it under 3,000 mg.',
        how: ['Worked out automatically from your food log.'],
        actions: { high: 'Drift (3,000–3,800): fluid in your head is rising — choose low-salt meals. Critical (over 3,800): eye and kidney-stone risk; low-salt meals only.' },
        diet: { high: 'Keep salt under 3,000 mg a day and eat more potassium.' }
    }),
    potassium_intake: m('potassium_intake', {
        name: 'Potassium', unit: 'mg/day', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [2500, 2500, 3500], high: [4700, 6000, 6000] }, src: SRC.diet,
        definition: 'Keeps your heart rhythm steady and helps protect bone calcium. Aim for 3,500–4,700 mg.',
        how: ['Worked out automatically from your food log.'],
        actions: { low: 'Critical (under 2,500): heart rhythm risk — eat potassium-rich food or take a supplement.', high: 'Pause extra potassium tablets and drink water.' },
        diet: { low: 'Aim for 3,500–4,700 mg a day (dried fruit, lentils).', high: 'Pause extra potassium tablets.' }
    }),
    magnesium_intake: m('magnesium_intake', {
        name: 'Magnesium', unit: 'mg/day', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [200, 200, 300], high: [400, 600, 600] }, src: SRC.diet,
        definition: 'Relaxes tight muscles (including period cramps) and supports bones. Aim for 300–400 mg.',
        how: ['Worked out automatically from your food log.'],
        actions: { low: 'Critical (under 200): more muscle and cramp pain — take a magnesium supplement.', high: 'Check your supplement dose.' },
        diet: { low: 'Aim for 300–400 mg a day.', high: 'Pause extra magnesium.' }
    }),
    iodine_intake: m('iodine_intake', {
        name: 'Iodine (thyroid)', unit: 'µg/day', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [100, 100, 150], high: NONE }, src: SRC.diet,
        definition: 'Protects your thyroid — especially on Mars, where soil dust blocks iodine. Aim for 150 µg.',
        how: ['From iodized water, meals and your daily multivitamin.'],
        actions: { low: 'Critical (under 100): thyroid risk if Martian dust is present — take the multivitamin.' },
        diet: { low: 'Aim for 150 µg a day.' }
    }),
    vit_c_pct: m('vit_c_pct', {
        name: 'Vitamin C (% of target)', unit: '% target', cat: 'DIET/SUSTENANCE', method: 'food_scan', decimals: 0,
        bands: { low: [50, 50, 80], high: NONE }, src: SRC.diet,
        definition: 'Space radiation slowly destroys vitamins C and B1 in stored food. The target is 90 mg of vitamin C a day.',
        how: ['Worked out from your food log, or scan the radiation tag on the shielded vitamin pack.'],
        actions: { low: 'Critical (under 50%): switch to the shielded fresh vitamin stock now.' },
        diet: { low: 'Take shielded vitamin C (90 mg) and B1 (1.2 mg).' }
    }),

    /* ------------------------------------------------------ CYCLE & BLOOD IRON */
    pill_missed: m('pill_missed', {
        name: 'Missed suppression pills', unit: 'days in a row', cat: 'GYN/CYCLE', method: 'pill_scan', decimals: 0, discrete: true,
        bands: { low: NONE, high: [0, 2, 2] }, src: SRC.gyn,
        definition: 'Missed daily cycle-suppression pills. Missing them can cause surprise bleeding.',
        how: ['Log 0 when you are on schedule, or how many days in a row you missed.'],
        actions: { high: 'Drift (1–2 missed): take the missed pill now and set a reminder. Critical (3 or more): tell the Flight Surgeon and check emergency stock.' },
        diet: {}
    }),
    breakthrough_days: m('breakthrough_days', {
        name: 'Breakthrough bleeding', unit: 'days in a row', cat: 'GYN/CYCLE', method: 'checkin', decimals: 0, discrete: true,
        bands: { low: NONE, high: [0, 3, 3] }, src: SRC.gyn,
        definition: 'Unexpected bleeding while on cycle suppression. 1–2 days of spotting is a warning; heavy bleeding for more than 3 days needs the Flight Surgeon.',
        how: ['Log how many days in a row you have had spotting or bleeding (0 if none).'],
        actions: { high: 'Drift: log it daily and check you have not missed pills. Critical (more than 3 days): tell the Flight Surgeon.' },
        diet: { high: 'Drink 500 mL more water and eat iron-rich food.' }
    }),
    menstrual_flow: m('menstrual_flow', {
        name: 'Period flow', unit: 'changes/day', cat: 'GYN/CYCLE', method: 'checkin', decimals: 0, discrete: true,
        bands: { low: NONE, high: [3, 5, 5] }, src: SRC.gyn,
        persist: { critical: 3, text: 'more than 2 days in a row' },
        definition: 'Pad or cup changes per day. Catches heavy bleeding early, before it causes low iron or dizziness.',
        how: ['Log daily changes in the check-in (0 on non-period days).'],
        actions: { high: 'Drift (4–5 a day): drink more water and eat more iron. Critical (over 5 a day for more than 2 days): tell the Crew Medical Officer and pause hard EVAs.' },
        diet: { high: 'Drink 500 mL more water and eat at least 18 mg of iron a day.' }
    }),
    cramping_pain: m('cramping_pain', {
        name: 'Period cramp pain', unit: '/10', cat: 'GYN/CYCLE', method: 'checkin', decimals: 0, discrete: true,
        bands: { low: NONE, high: [3, 6, 6] }, src: SRC.gyn,
        definition: 'Cramp pain from 0 to 10 (the NRS scale). Tight suit belts and Mars cold can make cramps worse.',
        how: ['Rate cramp pain 0–10 in the check-in.'],
        actions: { high: 'Drift (4–6): pain relief tablet and a heat pack. Critical (7–10): pause spacewalks and tell the Crew Medical Officer.' },
        diet: { high: 'Warm drinks and 300–400 mg of magnesium.' }
    }),
    ferritin: m('ferritin', {
        name: 'Stored iron (ferritin)', unit: 'µg/L', cat: 'GYN/CYCLE', method: 'finger_prick', decimals: 0,
        bands: { low: [20, 20, 30], high: [120, 200, 200] }, src: SRC.gyn,
        definition: 'Your backup iron supply. 30–120 µg/L is healthy. Low means anemia risk; very high means iron overload.',
        how: ['Put a finger-prick blood drop on the blood reader strip.'],
        actions: { low: 'Drift: add iron-rich meals. Critical (under 20): start the clinical iron supplement now.', high: 'Stored iron too high — switch to the low-iron (8 mg cap) diet.' },
        diet: { low: 'Eat iron-rich meals with vitamin C.', high: 'Keep food iron at or under 8 mg a day.' }
    }),
    hemoglobin: m('hemoglobin', {
        name: 'Blood oxygen carriers (hemoglobin)', unit: 'g/dL', cat: 'GYN/CYCLE', method: 'finger_prick',
        bands: { low: [11.0, 11.0, 12.0], high: NONE }, src: SRC.gyn,
        definition: 'Red blood cells carry oxygen. 12.0–15.5 g/dL is normal; low levels cause tiredness and fainting.',
        how: ['Put a finger-prick blood drop on the hemoglobin strip and insert it into the reader.'],
        actions: { low: 'Drift: more iron, folate and B12. Critical (under 11.0): pause spacewalks and tell the Crew Medical Officer.' },
        diet: { low: 'Boost iron, folate and B12.' }
    }),
    pill_potency: m('pill_potency', {
        name: 'Medicine strength (radiation)', unit: '% potency', cat: 'GYN/CYCLE', method: 'pill_scan', decimals: 0,
        bands: { low: [80, 80, 90], high: NONE }, src: SRC.gyn,
        definition: 'Space radiation can weaken stored pills over long trips. 90% or more is fine.',
        how: ['Scan the radiation tag on the pill pack.'],
        actions: { low: 'Drift: log it and use the freshest pack. Critical (under 80%): switch to the shielded backup stock and update the supply log.' },
        diet: {}
    }),
    sexual_oxytocin: m('sexual_oxytocin', {
        name: 'Pelvic comfort & relaxation', unit: '/5', cat: 'GYN/CYCLE', method: 'checkin', decimals: 0, discrete: true,
        bands: { low: [1, 1, 2], high: NONE }, src: SRC.gyn,
        definition: 'Optional, private 1–5 comfort rating. Relaxation (including oxytocin release) can ease pelvic tension and cramps.',
        how: ['Optional private 1–5 score in the check-in.'],
        actions: { low: 'Try heat, gentle stretching or quiet rest to ease pelvic tension.' },
        diet: { low: 'Warm water and 300–400 mg of magnesium.' }
    })
};

/* Typical 14-day values used to generate the demo mission log. */
const flat14 = (v, alt = v) => [v, alt, v, alt, v, v, alt, v, alt, v, alt, v, alt, v];
const DEMO_BASELINES = {
    onsd: flat14(5.4, 5.5), iop: flat14(16, 17), co2: flat14(2.1, 2.2), blood_co2: flat14(40, 41), ijv: flat14(16, 17),
    heart_rate: flat14(62, 64), spo2: flat14(98, 97), resp_rate: flat14(14, 15), tilt_hr: flat14(19, 21),
    sleep: flat14(7.0, 7.2), sleep_eff: flat14(89, 91), deep_sleep: flat14(19, 21), rem_sleep: flat14(22, 23), waso: flat14(18, 22),
    hrv: flat14(45, 47), pvt: flat14(3, 4), kss: flat14(3, 3), stress: flat14(2, 3), journal_sentiment: flat14(0.3, 0.25),
    dust: flat14(2.2, 2.3), temp: flat14(37.2, 37.3), rad: flat14(0.7, 0.8), spine: flat14(0.8, 0.9),
    emuco2: flat14(2.6, 2.7), ortho: flat14(91, 92), osmolality: flat14(288, 290), usg: flat14(1.019, 1.020),
    calcium_iss: flat14(310, 320), calcium_mars: flat14(260, 275), perchlorate: flat14(1.8, 2.0), bmd: flat14(-0.2, -0.3),
    pill_missed: flat14(0, 0), breakthrough_days: flat14(0, 0), ferritin: [68, 67, 67, 66, 66, 65, 65, 64, 64, 62, 61, 61, 62, 62],
    hemoglobin: flat14(13.6, 13.7), dietary_iron_cycle: flat14(20, 21), dietary_iron_low: flat14(6, 7),
    pill_potency: [99, 99, 99, 98, 98, 98, 98, 97, 97, 97, 97, 96, 96, 96], sexual_oxytocin: flat14(3, 4),
    caloric_balance: flat14(99, 101), protein_intake: flat14(1.3, 1.4), carbs_pct: flat14(52, 53), fats_pct: flat14(27, 28),
    dietary_fiber: flat14(28, 30), fluid_intake_female: flat14(2300, 2400), fluid_intake_male: flat14(2700, 2800),
    sodium_intake: flat14(2650, 2720), potassium_intake: flat14(3950, 4100), magnesium_intake: flat14(345, 355),
    iodine_intake: flat14(155, 160), vit_c_pct: flat14(94, 95)
};
