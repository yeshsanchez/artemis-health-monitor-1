/* =============================================================================
   A.R.T.E.M.I.S. — triage engine (no DOM in here)
   -----------------------------------------------------------------------------
   value -> Level 1..7 (research's bipolar scale) -> tier (team's 3 levels):
     Level 4            = Normal
     Levels 3, 5        = Drift
     Levels 2, 6        = Drift, flagged "high priority" (the Mars spec calls
                          these "High-Priority Alert"), unless listed below
     Levels 1, 7        = Critical
   To make Levels 2 and 6 Critical as well, change CRITICAL_LEVELS to
   [1, 2, 6, 7]. See docs/thresholds.md for why the default is [1, 7].
   ========================================================================== */

const CRITICAL_LEVELS = [1, 7];

const LEVEL_NAMES = {
    1: 'Very low', 2: 'Low', 3: 'Slightly low', 4: 'Normal', 5: 'Slightly high', 6: 'High', 7: 'Very high'
};

const TIER_LABEL = { GREEN: 'Normal', YELLOW: 'Drift', RED: 'Critical' };

/* ---------------------------------------------------------------- bands */
function getBands(metric, ctx) {
    if (metric.bandsFn) return { src: metric.src, ...metric.bandsFn(ctx) };
    const env = metric.envBands && metric.envBands[ctx.env];
    if (env) return { src: env.src || metric.src, low: env.low, high: env.high };
    return { src: metric.src, low: metric.bands.low, high: metric.bands.high };
}

function levelOf(value, bands) {
    const { low, high } = bands;
    if (low && value < low[2]) return value < low[0] ? 1 : (value < low[1] ? 2 : 3);
    if (high && value > high[0]) return value > high[2] ? 7 : (value > high[1] ? 6 : 5);
    return 4;
}

function tierOfLevel(level) {
    if (level === 4) return 'GREEN';
    return CRITICAL_LEVELS.includes(level) ? 'RED' : 'YELLOW';
}

const directionOfLevel = (level) => level < 4 ? 'low' : (level > 4 ? 'high' : 'nominal');

/* Evaluate one value (zone only — no persistence rules). */
function evaluateValue(value, metric, ctx) {
    const level = levelOf(value, getBands(metric, ctx));
    const tier = tierOfLevel(level);
    return { level, tier, direction: directionOfLevel(level), priority: tier === 'YELLOW' && (level === 2 || level === 6) };
}

/* Evaluate the latest reading, applying "must last N days" rules from the specs
   (e.g. calories: Critical only after more than 5 days in a row). */
function evaluateMetric(metric, ctx) {
    const h = metric.history;
    if (metric.stale) return { state: 'stale', tier: null };
    if (!h.length) return { state: 'empty', tier: null };
    const value = h[h.length - 1].v;
    const res = { state: 'ok', value, ...evaluateValue(value, metric, ctx), persistNote: null };

    if (res.tier === 'RED' && metric.persist && metric.persist.critical) {
        const need = metric.persist.critical;
        let run = 0;
        for (let i = h.length - 1; i >= 0; i--) {
            const r = evaluateValue(h[i].v, metric, ctx);
            if (r.tier === 'RED' && r.direction === res.direction) run++; else break;
        }
        if (run < need) {
            res.tier = 'YELLOW';
            res.priority = true;
            res.persistNote = `Critical range today — becomes Critical if it stays here ${metric.persist.text} (day ${run} of ${need}).`;
        }
    }
    return res;
}

/* ------------------------------------------------------------- display */
function formatNumber(v, decimals) {
    if (typeof v !== 'number' || !isFinite(v)) return '--';
    return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
const formatValue = (v, metric) => formatNumber(v, metric.decimals);

function safeZone(metric, ctx) {
    const b = getBands(metric, ctx);
    const min = b.low ? b.low[2] : null;
    const max = b.high ? b.high[0] : null;
    const f = (v) => formatNumber(v, metric.decimals);
    let text;
    if (min !== null && max !== null) text = `${f(min)} – ${f(max)} ${metric.unit}`;
    else if (min !== null) text = `${f(min)} ${metric.unit} or more`;
    else if (max !== null) text = `${f(max)} ${metric.unit} or less`;
    else text = 'Any value';
    return { min, max, text, src: b.src, bands: b };
}

/* ----------------------------------------------------------- forecast */
/* Least-squares line through the last (up to) 7 readings, projected 7 days. */
function forecast7(metric, ctx) {
    const vals = metric.history.map(h => h.v);
    if (vals.length < 3 || metric.stale) return { ok: false, have: vals.length };
    const pts = vals.slice(-7);
    const n = pts.length;
    const xm = (n - 1) / 2;
    const ym = pts.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    pts.forEach((y, x) => { num += (x - xm) * (y - ym); den += (x - xm) * (x - xm); });
    const slope = den ? num / den : 0;
    const last = vals[vals.length - 1];
    const projected = Array.from({ length: 7 }, (_, i) => last + slope * (i + 1));
    const now = evaluateValue(last, metric, ctx);
    let breach = null;
    for (let i = 0; i < 7; i++) {
        const p = evaluateValue(projected[i], metric, ctx);
        if ((now.tier === 'GREEN' && p.tier !== 'GREEN') || (now.tier === 'YELLOW' && p.tier === 'RED')) {
            breach = { day: i + 1, tier: p.tier, direction: p.direction };
            break;
        }
    }
    return { ok: true, slope, projected, breach, basis: n };
}

/* ------------------------------------------------------ dynamic targets */
/* Diet spec stages 1–3: base needs from the body profile, scaled by exercise
   and spacewalks, then capped by medical history. */
function computeTargets(profile, exertion) {
    const w = profile.weightKg || 62;
    const hM = (profile.heightCm || 168) / 100;
    const bf = Math.min(48, Math.max(5, profile.bodyFatPct || 21.5));
    const bmi = +(w / (hM * hM)).toFixed(1);
    const lbm = w * (1 - bf / 100);
    const tBaseKcal = Math.round((370 + 21.6 * lbm) * 1.512);          // Katch-McArdle × activity
    const eExercise = Math.round(exertion.aredKg * 0.025 + exertion.treadmillKm * 35);
    const eEva = exertion.evaKcalOverride !== null && exertion.evaKcalOverride !== undefined
        ? Math.round(exertion.evaKcalOverride) : Math.round(exertion.evaHours * 300);
    const tActiveKcal = tBaseKcal + eExercise + eEva;
    const working = exertion.aredKg > 0 || exertion.evaHours > 0;
    const proteinTargetG = +(w * (working ? 1.4 : 1.3)).toFixed(1);
    const carbsTargetG = Math.round((tActiveKcal * 0.525) / 4);
    const fatTargetG = Math.round((tActiveKcal * 0.275) / 9);
    const baseFluid = profile.sexMode === 'MALE' ? Math.max(2500, Math.round(w * 35)) : Math.max(2100, Math.round(w * 34));
    const fluidTargetMl = baseFluid + (profile.medHistory && profile.medHistory.kidneyStones ? 500 : 0);
    const ironTarget = profile.sexMode === 'FEMALE_CYCLE' ? { kind: 'min', mg: 18 } : { kind: 'max', mg: 8 };
    return { bmi, tBaseKcal, eExercise, eEva, tActiveKcal, proteinTargetG, carbsTargetG, fatTargetG, fluidTargetMl, sodiumCapMg: 3000, ironTarget };
}

/* ------------------------------------------------------------- dates */
const DAY_MS = 86400000;
const dayKey = (t = Date.now()) => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const noonOf = (t = Date.now()) => { const d = new Date(t); d.setHours(12, 0, 0, 0); return d.getTime(); };
const daysAgoNoon = (n) => noonOf(Date.now() - n * DAY_MS);

/* Insert or replace the reading for that calendar day (one reading per day). */
function upsertReading(metric, v, t = Date.now(), cap = 1200) {
    const key = dayKey(t);
    const idx = metric.history.findIndex(h => dayKey(h.t) === key);
    if (idx >= 0) metric.history[idx] = { t, v };
    else {
        metric.history.push({ t, v });
        metric.history.sort((a, b) => a.t - b.t);
    }
    if (metric.history.length > cap) metric.history.splice(0, metric.history.length - cap);
    metric.stale = false;
}

/* Seeded pseudo-random numbers so the demo log looks the same each time. */
function seededRandom(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
