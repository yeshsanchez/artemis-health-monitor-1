/* =============================================================================
   A.R.T.E.M.I.S. — plain-language content: glossary, galley menu, measuring
   pictures, coping exercises and the on-device journal word scorer.
   ========================================================================== */

/* Glossary — adapted from the team's plain-language glossary. `match` lists the
   exact spellings that get a tap-to-explain tooltip inside advice text. */
const GLOSSARY = [
    { term: 'SANS', match: ['SANS'], def: 'Spaceflight-Associated Neuro-ocular Syndrome. Fluid shifts into the head in space, flattening the back of the eye and swelling the optic nerve, which can blur vision for good.' },
    { term: 'LBNP (leg vacuum)', match: ['LBNP'], def: 'Lower Body Negative Pressure. An airtight chamber sealed at the waist that gently sucks body fluid back down into your legs, like Earth gravity does.' },
    { term: 'ARED (gym rig)', match: ['ARED'], def: 'Advanced Resistive Exercise Device — the space gym rig for squats and deadlifts that keeps bones and muscles loaded.' },
    { term: 'ORS', match: ['ORS'], def: 'Oral Rehydration Salts — an electrolyte drink packet that rehydrates faster than plain water.' },
    { term: 'EVA', match: ['EVA', 'EVAs'], def: 'Extravehicular Activity — a spacewalk or moonwalk outside the spacecraft or habitat.' },
    { term: 'ECLSS', match: ['ECLSS'], def: 'Environmental Control & Life Support System — the machinery that recycles air and water and scrubs out CO₂.' },
    { term: 'ONSD', match: ['ONSD'], def: 'Optic Nerve Sheath Diameter — the width of the sleeve around the nerve behind your eye. It swells when pressure in your head rises.' },
    { term: 'IOP', match: ['IOP'], def: 'Intraocular Pressure — the fluid pressure inside your eyeball.' },
    { term: 'Hypotony', match: ['hypotony'], def: 'Eye pressure that is too low, which can make the eye soft.' },
    { term: 'IJV', match: ['IJV'], def: 'Internal Jugular Vein — the big neck vein that drains blood from your head. Slow flow can let a clot form.' },
    { term: 'Doppler ultrasound', match: ['Doppler'], def: 'An ultrasound scan that shows how fast blood is moving, used to spot clots.' },
    { term: 'SpO₂', match: ['SpO₂'], def: 'Blood oxygen saturation — how full your red blood cells are with oxygen, measured with a finger clip.' },
    { term: 'pCO₂', match: ['pCO₂'], def: 'The amount of carbon dioxide dissolved in your blood.' },
    { term: 'HEPA', match: ['HEPA'], def: 'High-efficiency air filter that traps very fine dust.' },
    { term: 'USG', match: ['USG'], def: 'Urine Specific Gravity — how concentrated your urine is compared with pure water.' },
    { term: 'Osmolality', match: ['osmolality'], def: 'How concentrated your blood is. High means dehydrated; low means too much plain water.' },
    { term: 'BMD', match: ['BMD'], def: 'Bone Mineral Density — how much calcium and mineral is stored in your bones. Lower means weaker bones.' },
    { term: 'Alendronate', match: ['Alendronate'], def: 'A weekly bone-protecting medicine that slows how fast bone breaks down.' },
    { term: 'Potassium citrate', match: ['potassium citrate'], def: 'A daily supplement that helps stop calcium kidney stones from forming.' },
    { term: 'Perchlorates', match: ['perchlorates', 'perchlorate'], def: 'Toxic chlorine salts in Martian soil. If breathed in or swallowed they block the thyroid from using iodine.' },
    { term: 'KI (potassium iodide)', match: ['KI'], def: 'Potassium iodide tablets that fill the thyroid with safe iodine so toxins cannot block it.' },
    { term: '8-OHdG', match: ['8-OHdG'], def: 'A chemical in urine that shows cells are being damaged ("rusted") by dust or radiation.' },
    { term: 'SPE (solar storm)', match: ['SPE'], def: 'Solar Particle Event — a sudden burst of radiation from the Sun. Crew must get into the storm shelter.' },
    { term: 'GCR', match: ['GCR'], def: 'Galactic Cosmic Rays — high-energy particles from deep space that pass through thin spacecraft walls.' },
    { term: 'LCVG', match: ['LCVG'], def: 'Liquid Cooling & Ventilation Garment — the water-cooled underwear worn inside the spacesuit.' },
    { term: 'HRV / RMSSD', match: ['HRV', 'RMSSD'], def: 'Heart Rate Variability — the tiny changes in time between heartbeats. Lower than your usual means your nervous system is stressed or exhausted.' },
    { term: 'PVT', match: ['PVT'], def: 'Psychomotor Vigilance Test — a reaction-time test. A "lapse" is a response slower than 500 ms, a sign of hidden tiredness.' },
    { term: 'KSS', match: ['KSS'], def: 'Karolinska Sleepiness Scale — rate how sleepy you feel from 1 (very alert) to 9 (fighting sleep).' },
    { term: 'SWS (deep sleep)', match: ['SWS'], def: 'Slow-Wave Sleep — the deepest, most restoring stage of sleep.' },
    { term: 'REM sleep', match: ['REM'], def: 'Rapid Eye Movement sleep — the dreaming stage that helps memory and mood.' },
    { term: 'WASO', match: ['WASO'], def: 'Wake After Sleep Onset — minutes you spend awake after first falling asleep.' },
    { term: 'CBT', match: ['CBT'], def: 'Cognitive Behavioral Therapy — short, practical exercises for noticing and reframing stressful thoughts.' },
    { term: 'NRS', match: ['NRS'], def: 'Numeric Rating Scale — rate pain from 0 (none) to 10 (worst imaginable).' },
    { term: 'Neocytolysis', match: ['neocytolysis'], def: 'In space the body breaks down young red blood cells, releasing extra iron — why non-menstruating crew cap iron at 8 mg a day.' },
    { term: 'Ferritin', match: ['ferritin'], def: 'A blood test of your stored, backup iron.' },
    { term: 'Hemoglobin', match: ['hemoglobin'], def: 'The protein in red blood cells that carries oxygen.' },
    { term: 'Flight Surgeon', match: ['Flight Surgeon'], def: 'The mission doctor on Earth. On Mars or in transit, messages take minutes each way.' },
    { term: 'Crew Medical Officer', match: ['Crew Medical Officer'], def: 'The crewmember trained to give medical care on board when Earth is far away.' },
    { term: 'NEWS2', match: ['NEWS2'], def: 'National Early Warning Score — a hospital system for spotting worrying vital signs early.' }
];

/* Sample galley menu (approximate values per pouch/serving). */
const FOODS = [
    { id: 'eggs',       group: 'Meals',       name: 'Scrambled eggs',            kcal: 190, p: 13, c: 3,  f: 14, fib: 0,  na: 380, k: 150, mg: 12, fe: 1.5, i: 50, vc: 0 },
    { id: 'oatmeal',    group: 'Meals',       name: 'Oatmeal with raisins',      kcal: 220, p: 6,  c: 42, f: 4,  fib: 5,  na: 160, k: 260, mg: 55, fe: 2.0, i: 10, vc: 1 },
    { id: 'cereal',     group: 'Meals',       name: 'Iron-fortified cereal & milk', kcal: 220, p: 9, c: 36, f: 4, fib: 3, na: 260, k: 400, mg: 50, fe: 8.0, i: 60, vc: 15 },
    { id: 'brisket',    group: 'Meals',       name: 'Beef brisket',              kcal: 310, p: 28, c: 4,  f: 20, fib: 0,  na: 700, k: 380, mg: 25, fe: 3.0, i: 5,  vc: 0 },
    { id: 'teriyaki',   group: 'Meals',       name: 'Chicken teriyaki',          kcal: 270, p: 26, c: 18, f: 9,  fib: 1,  na: 650, k: 350, mg: 30, fe: 1.4, i: 10, vc: 2 },
    { id: 'curry',      group: 'Meals',       name: 'Lentil & spinach curry',    kcal: 260, p: 14, c: 38, f: 6,  fib: 11, na: 520, k: 640, mg: 80, fe: 5.5, i: 4,  vc: 12 },
    { id: 'mac',        group: 'Meals',       name: 'Macaroni & cheese',         kcal: 360, p: 15, c: 40, f: 15, fib: 2,  na: 820, k: 220, mg: 30, fe: 1.6, i: 30, vc: 0 },
    { id: 'shrimp',     group: 'Meals',       name: 'Shrimp cocktail',           kcal: 120, p: 18, c: 10, f: 1,  fib: 1,  na: 720, k: 300, mg: 40, fe: 0.8, i: 40, vc: 5 },
    { id: 'tortilla',   group: 'Snacks',      name: 'Tortilla',                  kcal: 110, p: 3,  c: 18, f: 3,  fib: 1,  na: 230, k: 50,  mg: 8,  fe: 1.0, i: 2,  vc: 0 },
    { id: 'pb',         group: 'Snacks',      name: 'Peanut butter',             kcal: 190, p: 7,  c: 7,  f: 16, fib: 2,  na: 140, k: 200, mg: 50, fe: 0.6, i: 1,  vc: 0 },
    { id: 'apricot',    group: 'Snacks',      name: 'Dried apricots',            kcal: 120, p: 2,  c: 30, f: 0,  fib: 4,  na: 5,   k: 580, mg: 20, fe: 1.5, i: 1,  vc: 1 },
    { id: 'apple',      group: 'Snacks',      name: 'Fresh apple (resupply)',    kcal: 95,  p: 0.5, c: 25, f: 0.3, fib: 4.4, na: 2, k: 195, mg: 9, fe: 0.2, i: 0, vc: 8 },
    { id: 'water',      group: 'Drinks',      name: 'Water 250 mL',              kcal: 0,   ml: 250 },
    { id: 'electro',    group: 'Drinks',      name: 'Electrolyte drink 250 mL',  kcal: 25,  c: 6,  na: 300, k: 100, ml: 250 },
    { id: 'juice',      group: 'Drinks',      name: 'Orange-mango drink 250 mL', kcal: 110, c: 27, k: 120, vc: 90, ml: 250 },
    { id: 'coffee',     group: 'Drinks',      name: 'Coffee 250 mL',             kcal: 5,   k: 110, mg: 7, ml: 250 },
    { id: 'multi',      group: 'Supplements', name: 'Multivitamin (iron-free) + D3', kcal: 0, mg: 100, i: 150, vc: 90 },
    { id: 'ironpill',   group: 'Supplements', name: 'Iron tablet 18 mg',         kcal: 0,   fe: 18 },
    { id: 'magnesium',  group: 'Supplements', name: 'Magnesium 200 mg',          kcal: 0,   mg: 200 }
];
const FOOD_BY_ID = Object.fromEntries(FOODS.map(f => [f.id, f]));

/* Coping exercises for the journal and stress check-in. */
const CBT_EXERCISES = {
    breathing: { title: 'Box breathing · 2 min', steps: ['Breathe in for 4 counts.', 'Hold for 4.', 'Breathe out for 4.', 'Hold for 4. Repeat 6 times.'] },
    grounding: { title: '5-4-3-2-1 grounding · 2 min', steps: ['Name 5 things you can see.', '4 things you can touch.', '3 things you can hear.', '2 things you can smell, and 1 thing you are grateful for.'] },
    reframe:   { title: 'Reframe one thought · 3 min', steps: ['Write the thought that is bothering you most.', 'What is the evidence for and against it?', 'Write a more balanced version you could say to a crewmate.'] },
    connect:   { title: 'Reach out · 5 min', steps: ['Tell a crewmate how your day is going.', 'Record a message for home — it sends when the link allows.'] },
    release:   { title: 'Release tension · 3 min', steps: ['Tense your feet for 5 seconds, then let go.', 'Work up through legs, belly, hands, shoulders and face.', 'Finish with three slow breaths.'] }
};

/* Tiny on-device word scorer (AFINN-style, -3..+3). Not a clinical tool. */
const SENTIMENT_WORDS = {
    good: 2, great: 3, happy: 3, calm: 2, relaxed: 2, rested: 2, proud: 2, excited: 3, fun: 2, love: 3, loved: 3, grateful: 3,
    thankful: 2, energized: 2, strong: 2, okay: 1, ok: 1, fine: 1, better: 2, focused: 2, motivated: 2, hopeful: 2, smile: 2,
    laughed: 2, laugh: 2, enjoy: 2, enjoyed: 2, beautiful: 3, amazing: 3, peaceful: 2, confident: 2, productive: 2, connected: 2,
    safe: 1, success: 2, accomplished: 2, wonderful: 3, glad: 2, awesome: 3, nice: 2, positive: 2, refreshed: 2,
    bad: -2, tired: -2, exhausted: -3, sad: -2, angry: -3, anxious: -2, anxiety: -2, worried: -2, worry: -2, stressed: -2,
    stress: -1, overwhelmed: -3, lonely: -3, alone: -2, isolated: -2, homesick: -2, miss: -1, scared: -2, afraid: -2, panic: -3,
    frustrated: -2, annoyed: -2, irritated: -2, hopeless: -3, depressed: -3, cry: -2, crying: -2, cried: -2, hurt: -2, pain: -2,
    headache: -2, sick: -2, nauseous: -2, conflict: -2, argument: -2, argued: -2, fight: -2, failed: -2, failure: -2,
    mistake: -2, bored: -1, restless: -1, insomnia: -2, dread: -3, terrible: -3, awful: -3, worst: -3, numb: -2, empty: -2,
    trapped: -3, burnout: -3, drained: -2, foggy: -1, cranky: -2, upset: -2, nervous: -2, tense: -2, miserable: -3
};
const NEGATORS = new Set(['not', 'no', 'never', 'dont', "don't", 'didnt', "didn't", 'isnt', "isn't", 'wasnt', "wasn't", 'cant', "can't", 'hardly', 'without']);

function scoreJournalText(text) {
    const tokens = String(text || '').toLowerCase().replace(/[^a-z'\s]/g, ' ').split(/\s+/).filter(Boolean);
    let sum = 0, hits = 0;
    tokens.forEach((tok, i) => {
        const w = SENTIMENT_WORDS[tok];
        if (w === undefined) return;
        const negated = tokens.slice(Math.max(0, i - 3), i).some(t => NEGATORS.has(t));
        sum += negated ? w * -0.74 : w;
        hits++;
    });
    const compound = sum / Math.sqrt(sum * sum + 15);
    return { score: +compound.toFixed(2), hits };
}

/* "How to measure" pictures — one per measuring method, line-art in theme colors. */
const PIC = {
    frame: (label, body) => `<svg viewBox="0 0 200 96" class="method-pic" role="img" aria-label="${label}"><text x="10" y="16" class="p-t">${label}</text>${body}</svg>`
};
const METHOD_PICTURES = {
    eye_ultrasound: PIC.frame('EYELID + ULTRASOUND PROBE', '<path class="p-l" d="M22 56 Q62 30 102 56 Q62 78 22 56Z"/><path class="p-l" d="M26 56 Q62 66 98 56"/><circle class="p-af" cx="94" cy="44" r="2"/><circle class="p-af" cx="98" cy="50" r="2"/><rect class="p-a" x="104" y="38" width="64" height="22" rx="6"/><line class="p-a" x1="168" y1="49" x2="190" y2="49"/><text x="114" y="53" class="p-t">PROBE</text>'),
    tonometer: PIC.frame('HANDHELD TONOMETER', '<path class="p-l" d="M18 56 Q56 30 94 56 Q56 82 18 56Z"/><circle class="p-l" cx="56" cy="56" r="11"/><circle class="p-af" cx="56" cy="56" r="4"/><rect class="p-a" x="112" y="48" width="70" height="16" rx="8"/><line class="p-a" x1="112" y1="56" x2="98" y2="56"/>'),
    neck_ultrasound: PIC.frame('SIDE OF NECK + PROBE', '<path class="p-l" d="M30 86 L34 60 Q30 40 44 30 Q60 20 74 32 Q82 40 78 52 L80 86"/><rect class="p-a" x="70" y="56" width="16" height="26" rx="4"/><polyline class="p-a" points="100,70 118,70 124,54 132,82 140,58 148,70 190,70"/>'),
    wall_monitor: PIC.frame('CABIN WALL AIR MONITOR', '<rect class="p-s" x="40" y="26" width="120" height="58" rx="6"/><text x="56" y="52" class="p-t">CO₂ mmHg</text><text x="56" y="74" class="p-big">2.1</text><circle class="p-af" cx="146" cy="40" r="4"/>'),
    finger_prick: PIC.frame('FINGER-PRICK → READER', '<path class="p-l" d="M18 86 L18 50 Q18 36 30 36 Q42 36 42 50 L42 86"/><path class="p-af" d="M30 26 Q26 32 30 34 Q34 32 30 26Z"/><rect class="p-a" x="60" y="52" width="40" height="8" rx="2"/><line class="p-l" x1="100" y1="56" x2="118" y2="56" stroke-dasharray="3 3"/><rect class="p-s" x="120" y="34" width="66" height="46" rx="6"/><rect class="p-a" x="128" y="42" width="50" height="18" rx="3"/><rect class="p-l" x="138" y="68" width="30" height="5" rx="2"/>'),
    urine_strip: PIC.frame('URINE CUP → TEST STRIP → READER', '<path class="p-l" d="M20 40 L26 84 L58 84 L64 40Z"/><rect class="p-a" x="40" y="26" width="6" height="40" rx="2"/><line class="p-l" x1="72" y1="60" x2="104" y2="60" stroke-dasharray="3 3"/><rect class="p-s" x="108" y="36" width="78" height="46" rx="6"/><rect class="p-a" x="116" y="54" width="40" height="8" rx="2"/>'),
    urine_24h: PIC.frame('24-HOUR URINE → ANALYZER', '<path class="p-l" d="M22 34 L60 34 L60 86 L22 86Z"/><text x="30" y="64" class="p-t">24h</text><line class="p-a" x1="68" y1="60" x2="96" y2="60"/><rect class="p-a" x="96" y="56" width="18" height="8" rx="2"/><rect class="p-s" x="122" y="32" width="66" height="54" rx="6"/><text x="132" y="62" class="p-t">10 mL</text>'),
    urine_lab: PIC.frame('SAMPLE → HABITAT LAB ANALYZER', '<rect class="p-l" x="24" y="34" width="22" height="50" rx="6"/><rect class="p-af" x="28" y="58" width="14" height="22" rx="3"/><line class="p-l" x1="54" y1="60" x2="84" y2="60" stroke-dasharray="3 3"/><rect class="p-s" x="88" y="28" width="100" height="58" rx="6"/><circle class="p-a" cx="164" cy="56" r="14"/><line class="p-a" x1="164" y1="56" x2="164" y2="46"/><line class="p-a" x1="164" y1="56" x2="172" y2="56"/><text x="98" y="52" class="p-t">5 MIN</text>'),
    bone_scanner: PIC.frame('FOREARM / HEEL IN BONE SCANNER', '<rect class="p-s" x="92" y="30" width="70" height="56" rx="10"/><ellipse class="p-a" cx="127" cy="58" rx="16" ry="20"/><path class="p-l" d="M14 50 L120 52 Q132 54 132 60 Q132 66 120 66 L14 68"/><line class="p-af-l" x1="127" y1="38" x2="127" y2="78"/>'),
    watch: PIC.frame('SLEEP WATCH · SYNCS ON WAKE', '<path class="p-l" d="M10 46 L190 46 M10 72 L190 72"/><rect class="p-s" x="78" y="36" width="44" height="46" rx="10"/><path class="p-a" d="M106 50 a10 10 0 1 0 6 16 a8 8 0 1 1 -6 -16Z"/>'),
    chest_strap: PIC.frame('CHEST STRAP · REST 5 MIN', '<path class="p-l" d="M50 86 L46 40 Q60 28 100 28 Q140 28 154 40 L150 86"/><path class="p-a" d="M48 58 L152 58"/><rect class="p-s" x="86" y="50" width="28" height="16" rx="4"/><polyline class="p-a" points="160,40 168,40 172,30 178,50 182,40 192,40"/>'),
    finger_clip: PIC.frame('PULSE OXIMETER ON FINGERTIP', '<path class="p-l" d="M10 64 L90 64 Q100 64 100 56 Q100 48 90 48 L10 48"/><rect class="p-s" x="74" y="36" width="44" height="40" rx="8"/><text x="128" y="54" class="p-t">SpO₂</text><text x="128" y="74" class="p-big">98</text>'),
    tablet_test: PIC.frame('TAP WHEN THE BOX TURNS AMBER', '<rect class="p-s" x="44" y="26" width="112" height="64" rx="8"/><rect class="p-warn" x="78" y="40" width="44" height="34" rx="4"/><circle class="p-l" cx="140" cy="80" r="7"/>'),
    checkin: PIC.frame('30-SECOND CHECK-IN', '<rect class="p-s" x="62" y="22" width="76" height="70" rx="10"/><line class="p-l" x1="74" y1="44" x2="126" y2="44"/><circle class="p-af" cx="96" cy="44" r="4"/><line class="p-l" x1="74" y1="60" x2="126" y2="60"/><circle class="p-af" cx="112" cy="60" r="4"/><line class="p-l" x1="74" y1="76" x2="126" y2="76"/><circle class="p-af" cx="84" cy="76" r="4"/>'),
    journal: PIC.frame('PRIVATE JOURNAL · STAYS ON DEVICE', '<rect class="p-s" x="56" y="24" width="72" height="66" rx="6"/><line class="p-l" x1="66" y1="42" x2="118" y2="42"/><line class="p-l" x1="66" y1="54" x2="118" y2="54"/><line class="p-l" x1="66" y1="66" x2="104" y2="66"/><rect class="p-a" x="136" y="56" width="24" height="20" rx="3"/><path class="p-a" d="M141 56 v-6 a7 7 0 0 1 14 0 v6"/>'),
    suit_display: PIC.frame('SUIT CHEST / WRIST DISPLAY', '<circle class="p-l" cx="60" cy="40" r="20"/><path class="p-l" d="M34 90 L36 66 Q60 56 84 66 L86 90"/><rect class="p-a" x="50" y="70" width="20" height="12" rx="2"/><rect class="p-s" x="116" y="40" width="70" height="36" rx="6"/><text x="124" y="62" class="p-t">37.2 °C</text>'),
    rad_badge: PIC.frame('BADGE ON OUTER POCKET, FACING OUT', '<rect class="p-s" x="76" y="26" width="48" height="62" rx="6"/><circle class="p-a" cx="100" cy="58" r="5"/><path class="p-af" d="M100 58 L92 44 A16 16 0 0 1 108 44Z"/><path class="p-af" d="M100 58 L116 58 A16 16 0 0 1 108 72Z"/><path class="p-af" d="M100 58 L92 72 A16 16 0 0 1 84 58Z"/>'),
    height_bar: PIC.frame('STAND AGAINST THE HEIGHT BAR', '<line class="p-a" x1="120" y1="22" x2="120" y2="90"/><line class="p-a" x1="112" y1="30" x2="128" y2="30"/><line class="p-l" x1="114" y1="46" x2="120" y2="46"/><line class="p-l" x1="114" y1="62" x2="120" y2="62"/><line class="p-l" x1="114" y1="78" x2="120" y2="78"/><circle class="p-l" cx="92" cy="36" r="8"/><path class="p-l" d="M92 44 L92 70 M80 54 L104 54 M92 70 L84 90 M92 70 L100 90"/>'),
    bp_cuff: PIC.frame('LIE 5 MIN → STAND → READ CUFF', '<rect class="p-l" x="14" y="66" width="52" height="8" rx="3"/><line class="p-l" x1="74" y1="70" x2="92" y2="70" stroke-dasharray="3 3"/><path class="p-l" d="M104 86 L106 40 Q118 32 130 40 L132 86"/><rect class="p-a" x="102" y="48" width="32" height="14" rx="3"/><circle class="p-s" cx="170" cy="56" r="16"/><line class="p-a" x1="170" y1="56" x2="178" y2="46"/>'),
    food_scan: PIC.frame('SCAN POUCH · SLIDE PORTION', '<rect class="p-s" x="20" y="26" width="58" height="62" rx="8"/><line class="p-l" x1="32" y1="44" x2="32" y2="64"/><line class="p-l" x1="38" y1="44" x2="38" y2="64"/><line class="p-l" x1="42" y1="44" x2="42" y2="64"/><line class="p-l" x1="48" y1="44" x2="48" y2="64"/><line class="p-l" x1="54" y1="44" x2="54" y2="64"/><line class="p-a" x1="86" y1="56" x2="114" y2="56" stroke-dasharray="3 3"/><line class="p-l" x1="120" y1="70" x2="186" y2="70"/><circle class="p-af" cx="164" cy="70" r="6"/><text x="120" y="56" class="p-t">PORTION</text>'),
    pill_scan: PIC.frame('SCAN THE PILL PACK TAG', '<rect class="p-s" x="24" y="30" width="92" height="56" rx="6"/><circle class="p-l" cx="44" cy="50" r="7"/><circle class="p-l" cx="70" cy="50" r="7"/><circle class="p-l" cx="96" cy="50" r="7"/><circle class="p-l" cx="44" cy="70" r="7"/><circle class="p-l" cx="70" cy="70" r="7"/><rect class="p-a" x="130" y="40" width="54" height="36" rx="5"/><text x="140" y="62" class="p-t">TAG</text>')
};
