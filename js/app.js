/* =============================================================================
   A.R.T.E.M.I.S. — UI controller
   Depends on: metrics.js, content.js, engine.js, body3d.js (+ Chart.js, Three.js)
   ========================================================================== */
(function () {
    'use strict';

    /* =========================================================== helpers */
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const uniq = (arr) => [...new Set(arr)];
    const fmtDate = (t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fmtTime = (t) => new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const COLORS = {};
    function readColors() {
        Object.assign(COLORS, {
            accent: cssVar('--accent'), ok: cssVar('--ok'), warn: cssVar('--warn'), crit: cssVar('--crit'), idle: cssVar('--idle'),
            text: cssVar('--text'), text2: cssVar('--text-2'), text3: cssVar('--text-3'), line: cssVar('--line'),
            surface: cssVar('--surface'), ring: cssVar('--ring'), accentGlow: cssVar('--accent'), grid: cssVar('--line')
        });
    }
    const withAlpha = (hex, a) => {
        const h = hex.replace('#', '');
        const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
        return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    };

    /* ------------------------------------------------------------- theme */
    const THEME_KEY = 'artemis_theme';
    const currentTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    function applyTheme(theme, save) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) { try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage blocked */ } }
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1020' : '#eef1f6');
        const btn = $('btn-theme');
        if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        readColors();
        if (viewer) viewer.setTheme(COLORS);
        if (CTX !== undefined && document.readyState !== 'loading' && $('metric-list').childElementCount) render();
    }

    function toast(msg) {
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = msg;
        const box = $('toasts');
        while (box.children.length >= 2) box.firstElementChild.remove();
        box.appendChild(el);
        setTimeout(() => el.remove(), 3200);
    }

    /* ============================================================ storage */
    const PROFILE_KEY = 'artemis_crew_profile_v2';
    const STATE_KEY = 'artemis_state_v3';
    const store = {
        get(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } },
        del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
    };

    const DEFAULT_PROFILE = {
        astronautId: 'ASTRO-084', name: 'Cmdr. Elena Vance', age: 34, role: 'Payload & Medical Officer',
        heightCm: 168, weightKg: 62, bodyFatPct: 21.5, bmdTScore: -0.3, sexMode: 'FEMALE_CYCLE', hrvBaseline: 45,
        cycleLengthDays: 28, cycleDay: 1, flowBaseline: 'Moderate', suppressionRegimen: 'Continuous Combined Oral Pill',
        crampingBaseline: 'None / Mild (0-3 NRS)', dietaryPreference: 'Standard Space Ration', foodAllergies: 'None',
        medHistory: { anemia: false, osteopenia: false, kidneyStones: false, sans: false, pcosEndo: false, clottingFactor: false, nsaidAllergy: false, iodineAllergy: false }
    };
    const PROFILE_PRESETS = {
        cycle: { astronautId: 'ASTRO-052', name: 'Dr. Maya Lin', age: 32, role: 'Flight Engineer / EVA Specialist', heightCm: 164, weightKg: 58, bodyFatPct: 22, bmdTScore: -0.2,
            sexMode: 'FEMALE_CYCLE', hrvBaseline: 52, cycleLengthDays: 29, cycleDay: 2, flowBaseline: 'Moderate', crampingBaseline: 'Moderate (4-6 NRS)',
            dietaryPreference: 'Plant-Forward / Vegetarian', foodAllergies: 'Shellfish', medHistory: { anemia: true, kidneyStones: true, nsaidAllergy: true } },
        suppressed: { astronautId: 'ASTRO-084', name: 'Cmdr. Elena Vance', age: 34, role: 'Payload & Medical Officer', heightCm: 168, weightKg: 62, bodyFatPct: 21.5, bmdTScore: -0.4,
            sexMode: 'FEMALE_SUPPRESSED', hrvBaseline: 45, suppressionRegimen: 'Continuous Combined Oral Pill', dietaryPreference: 'Low-Sodium Baseline', foodAllergies: 'None',
            medHistory: { kidneyStones: true, sans: true } },
        male: { astronautId: 'ASTRO-019', name: 'Maj. Marcus Cole', age: 37, role: 'Mission Commander', heightCm: 180, weightKg: 78, bodyFatPct: 15, bmdTScore: 0.2,
            sexMode: 'MALE', hrvBaseline: 48, dietaryPreference: 'Standard Space Ration', foodAllergies: 'None', medHistory: { sans: true } }
    };
    const mergeProfile = (base, inc = {}) => {
        const p = { ...base, ...inc, medHistory: { ...base.medHistory, ...(inc.medHistory || {}) } };
        if (!['FEMALE_CYCLE', 'FEMALE_SUPPRESSED', 'MALE'].includes(p.sexMode)) p.sexMode = base.sexMode;
        return p;
    };

    const state = {
        profile: mergeProfile(DEFAULT_PROFILE, store.get(PROFILE_KEY) || {}),
        hasProfile: Boolean(store.get(PROFILE_KEY)),
        env: '0g_station', filter: 'ALL', selected: 'onsd', range: '14', view: 'organs', tab: 'overview',
        exertion: { aredKg: 0, treadmillKm: 0, evaHours: 0, evaKcalOverride: null },
        freeze: false,
        streak: { count: 0, last: null, days: [] },
        manual: { date: null, vitamins: false },
        journal: [],
        meals: { date: null, items: [], savedAt: null },
        armed: {}, executed: {},
        delay: { '0g_transit': 14, '0.38g': 18 },
        reminder: { time: '19:00', notify: false, lastNotified: null }
    };

    function loadState() {
        const s = store.get(STATE_KEY);
        if (!s) return;
        ['env', 'filter', 'selected', 'range', 'view', 'tab', 'freeze', 'journal', 'executed'].forEach(k => { if (s[k] !== undefined) state[k] = s[k]; });
        ['exertion', 'streak', 'manual', 'meals', 'delay', 'reminder'].forEach(k => { if (s[k]) state[k] = { ...state[k], ...s[k] }; });
        if (!ENVIRONMENTS[state.env]) state.env = '0g_station';
        Object.entries(s.history || {}).forEach(([id, rows]) => {
            if (METRICS[id] && Array.isArray(rows)) METRICS[id].history = rows.filter(r => Array.isArray(r) && isFinite(r[1])).map(([t, v]) => ({ t, v }));
        });
        (s.stale || []).forEach(id => { if (METRICS[id]) METRICS[id].stale = true; });
    }
    let saveTimer = null;
    function saveState() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            const history = {};
            Object.values(METRICS).forEach(m => { if (m.history.length) history[m.id] = m.history.map(h => [h.t, h.v]); });
            store.set(STATE_KEY, {
                env: state.env, filter: state.filter, selected: state.selected, range: state.range, view: state.view, tab: state.tab,
                exertion: state.exertion, freeze: state.freeze, streak: state.streak, manual: state.manual, journal: state.journal.slice(-60),
                meals: state.meals, executed: state.executed, delay: state.delay, reminder: state.reminder,
                history, stale: Object.values(METRICS).filter(m => m.stale).map(m => m.id)
            });
        }, 250);
    }
    const saveProfile = () => { store.set(PROFILE_KEY, state.profile); state.hasProfile = true; };

    /* ============================================================ context */
    let CTX = null;
    const makeCtx = () => ({ env: state.env, sexMode: state.profile.sexMode, profile: state.profile, targets: computeTargets(state.profile, state.exertion) });
    const ctx = () => CTX || (CTX = makeCtx());
    const invalidate = () => { CTX = null; };

    const activeIds = () => uniq([...(ENV_METRICS[state.env] || []), ...VITAL_METRICS, ...MIND_METRICS, ...DIET_METRICS, ...(GYN_METRICS[state.profile.sexMode] || [])]);
    const evalOf = (id) => evaluateMetric(METRICS[id], ctx());
    const env = () => ENVIRONMENTS[state.env];
    const delayMinutes = () => env().delay.adjustable ? (state.delay[state.env] ?? env().delay.min) : 0;
    const isAutonomous = () => env().autonomous;
    const regionsForProfile = () => REGIONS.filter(r => r.id !== 'GYN/CYCLE' || state.profile.sexMode !== 'MALE');
    const loggedToday = (ids) => ids.some(id => { const h = METRICS[id] && METRICS[id].history; return h && h.length && dayKey(h[h.length - 1].t) === dayKey(); });

    function regionStatus(regionId, ids = activeIds()) {
        const mine = ids.filter(id => METRICS[id].cat === regionId);
        if (!mine.length) return { status: 'inactive', red: 0, yellow: 0 };
        let red = 0, yellow = 0, any = false;
        mine.forEach(id => {
            const r = evalOf(id);
            if (r.state === 'stale') { yellow++; any = true; return; }
            if (r.state !== 'ok') return;
            any = true;
            if (r.tier === 'RED') red++; else if (r.tier === 'YELLOW') yellow++;
        });
        if (!any) return { status: 'idle', red, yellow };
        return { status: red ? 'RED' : (yellow ? 'YELLOW' : 'GREEN'), red, yellow };
    }

    /* ======================================================= glossary links */
    const TERM_INDEX = {};
    let TERM_RE = null;
    function buildTermIndex() {
        const alts = [];
        GLOSSARY.forEach(g => g.match.forEach(mt => {
            const variants = mt === mt.toLowerCase() ? [mt, mt[0].toUpperCase() + mt.slice(1)] : [mt];
            variants.forEach(v => { TERM_INDEX[v] = g; alts.push(v); });
        }));
        alts.sort((a, b) => b.length - a.length);
        TERM_RE = new RegExp(`(?<![\\w-])(${alts.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'g');
    }
    function linkTerms(text) {
        const seen = new Set();
        return esc(text).replace(TERM_RE, (match) => {
            const g = TERM_INDEX[match];
            if (!g || seen.has(g.term)) return match;
            seen.add(g.term);
            return `<button type="button" class="term" data-term="${esc(g.term)}">${match}</button>`;
        });
    }

    /* ========================================================= status bits */
    const ICONS = {
        GREEN: '<svg class="status-icon c-GREEN" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="currentColor"/></svg>',
        YELLOW: '<svg class="status-icon c-YELLOW" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1z" fill="currentColor"/></svg>',
        RED: '<svg class="status-icon c-RED" viewBox="0 0 16 16" aria-hidden="true"><polygon points="5.2,1 10.8,1 15,5.2 15,10.8 10.8,15 5.2,15 1,10.8 1,5.2" fill="currentColor"/></svg>',
        empty: '<svg class="status-icon c-empty" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
        idle: '<svg class="status-icon c-idle" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
        stale: '<svg class="status-icon c-stale" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.5 2"/></svg>',
        inactive: '<svg class="status-icon c-inactive" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="currentColor"/></svg>'
    };
    const iconFor = (r) => r.state === 'stale' ? ICONS.stale : (r.state === 'empty' ? ICONS.empty : ICONS[r.tier]);

    function badgeHTML(r) {
        if (r.state === 'stale') return `<span class="badge t-stale">${ICONS.stale}Data stale</span>`;
        if (r.state === 'empty') return `<span class="badge t-empty">${ICONS.empty}No reading yet</span>`;
        if (r.tier === 'RED') return `<span class="badge t-RED"><svg viewBox="0 0 16 16"><polygon points="5.2,1 10.8,1 15,5.2 15,10.8 10.8,15 5.2,15 1,10.8 1,5.2" fill="currentColor"/></svg>Critical</span>`;
        if (r.tier === 'YELLOW' && r.priority) return `<span class="badge t-priority"><svg viewBox="0 0 16 16"><path d="M8 1.8 15 14H1z" fill="currentColor"/></svg>Drift · high priority</span>`;
        if (r.tier === 'YELLOW') return `<span class="badge t-YELLOW"><svg viewBox="0 0 16 16"><path d="M8 1.8 15 14H1z" fill="currentColor"/></svg>Drift</span>`;
        return `<span class="badge t-GREEN"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="currentColor"/></svg>Normal</span>`;
    }
    const tierBadge = (tier) => badgeHTML({ state: 'ok', tier, priority: false });

    /* ============================================================= render */
    function render() {
        invalidate();
        const ids = activeIds();
        if (!ids.includes(state.selected)) state.selected = ids[0];
        if (state.filter !== 'ALL' && !regionsForProfile().some(r => r.id === state.filter)) state.filter = 'ALL';
        renderHeader(ids);
        renderRegions(ids);
        renderSide(ids);
        renderList(ids);
        renderInspector();
        renderToday();
        renderFood();
        renderMission();
        saveState();
    }

    /* ------------------------------------------------------------- header */
    function renderHeader(ids) {
        const e = env();
        const sig = $('comms-status');
        let text, cls, tip;
        if (e.autonomous) {
            const d = delayMinutes();
            const blackout = d >= 26;
            text = blackout ? 'Blackout' : `${d} min`;
            cls = blackout ? 'signal is-off' : 'signal is-auto';
            tip = blackout
                ? `Solar blackout: about ${d} minutes each way. The app runs fully on board.`
                : `Self-guided mode: messages take ${d} minutes to reach Earth, so the app guides you on its own.`;
        } else {
            text = 'Live';
            cls = 'signal is-live';
            tip = `Live link to Earth (${e.delay.text} delay). A flight surgeon can be reached in real time.`;
        }
        $('comms-text').textContent = text;
        sig.className = cls;
        sig.title = tip;
        sig.setAttribute('aria-label', tip);
        $('env-selector').value = state.env;
        const p = state.profile;
        $('header-profile-name').textContent = p.name;
        $('header-profile-meta').textContent = `${p.astronautId} · ${p.role}`;
        $('profile-initials').textContent = initials(p.name);
    }
    function initials(name) {
        const words = String(name).split(/\s+/).filter(w => w && !w.endsWith('.'));
        return (words.slice(0, 2).map(w => w[0]).join('') || 'A').toUpperCase();
    }

    function readiness(ids = activeIds()) {
        let score = 100, worst = 'GREEN', logged = 0, stale = 0;
        ids.forEach(id => {
            const r = evalOf(id);
            if (r.state === 'stale') { score -= 5; stale++; if (worst === 'GREEN') worst = 'YELLOW'; return; }
            if (r.state !== 'ok') return;
            logged++;
            if (r.tier === 'RED') { score -= 22; worst = 'RED'; }
            else if (r.tier === 'YELLOW') { score -= r.priority ? 12 : 8; if (worst !== 'RED') worst = 'YELLOW'; }
        });
        return { score: Math.max(0, Math.min(100, score)), worst, any: logged + stale > 0 };
    }

    /* ------------------------------------------------- hero card + vitals */
    function renderSide(ids) {
        const p = state.profile;
        const mode = { FEMALE_CYCLE: 'Natural cycle', FEMALE_SUPPRESSED: 'Cycle suppression', MALE: 'Male' }[p.sexMode];
        $('profile-hero').innerHTML = `<button class="hero-edit" type="button" data-edit-profile>Edit</button>
            <div class="hero-top"><div class="hero-avatar">${esc(initials(p.name))}</div>
            <div><div class="hero-name">${esc(p.name)}</div><div class="hero-role">${esc(p.astronautId)} · ${esc(p.role)}</div></div></div>
            <div class="hero-tags"><span>${p.age} yrs</span><span>${p.weightKg} kg</span><span>${p.heightCm} cm</span><span>${esc(mode)}</span><span>${esc(env().short)}</span></div>`;

        const vital = (id, icon, label) => {
            const m = METRICS[id], r = evalOf(id);
            const val = r.state === 'ok' ? formatValue(r.value, m) : '--';
            const foot = r.state === 'ok' ? `${ICONS[r.tier]}${TIER_LABEL[r.tier]}` : (r.state === 'stale' ? `${ICONS.stale}Data stale` : `${ICONS.empty}No reading yet`);
            return `<button type="button" class="vital" data-select="${id}"><span class="vital-top"><span class="vital-icon"><svg width="16" height="16"><use href="#${icon}"/></svg></span>${label}</span>
                <span class="vital-val">${val}<small>${esc(m.unit)}</small></span><span class="vital-foot">${foot}</span></button>`;
        };
        const rd = readiness(ids);
        $('vitals').innerHTML = vital('heart_rate', 'i-heart', 'Heart rate') + vital('spo2', 'i-o2', 'Blood oxygen') + vital('sleep', 'i-moon', 'Sleep') +
            `<div class="vital" title="Starts at 100 and drops for every reading in Drift or Critical."><span class="vital-top"><span class="vital-icon"><svg width="16" height="16"><use href="#i-gauge"/></svg></span>Flight readiness</span>
             <span class="vital-val">${rd.score}<small>/100</small></span><span class="vital-foot">${rd.any ? `${ICONS[rd.worst]}${TIER_LABEL[rd.worst]} overall` : `${ICONS.empty}No readings yet`}</span></div>`;
    }

    /* ---------------------------------------------------- regions + 3D body */
    let viewer = null;
    function renderRegions(ids) {
        const statuses = {}, labels = {};
        const html = regionsForProfile().map(r => {
            const s = regionStatus(r.id, ids);
            statuses[r.id] = s.status;
            const text = { GREEN: 'Normal', YELLOW: `Drift · ${s.yellow}`, RED: `Critical · ${s.red}`, idle: 'No data', inactive: 'Not tracked' }[s.status];
            labels[r.id] = text;
            const icon = ICONS[s.status] || ICONS.idle;
            return `<button type="button" class="region-item" data-region="${r.id}" aria-pressed="${state.filter === r.id}">${icon}<b>${esc(r.label)}</b><span class="rs t-${s.status}">${text}</span></button>`;
        }).join('');
        $('region-list').innerHTML = html;
        $('btn-all-systems').hidden = state.filter === 'ALL';
        if (viewer) {
            viewer.setRegionEnabled('GYN/CYCLE', state.profile.sexMode !== 'MALE');
            viewer.setStatuses(statuses, labels);
            syncLayers(viewer.setActive(state.filter === 'ALL' ? null : state.filter));
        }
    }
    function syncLayers(layers) {
        if (!layers) return;
        document.querySelectorAll('[data-layer]').forEach(i => { i.checked = !!layers[i.dataset.layer]; });
    }

    function setFilter(regionId) {
        state.filter = state.filter === regionId ? 'ALL' : regionId;
        if (state.filter !== 'ALL') {
            const first = activeIds().find(id => METRICS[id].cat === state.filter);
            if (first && METRICS[state.selected].cat !== state.filter) state.selected = first;
            if (viewer) viewer.focus(state.filter);
        } else if (viewer) viewer.reset();
        render();
    }

    /* --------------------------------------------------------------- list */
    function renderList(ids) {
        const regions = regionsForProfile().filter(r => state.filter === 'ALL' || r.id === state.filter);
        $('list-title').textContent = state.filter === 'ALL' ? 'All readings' : REGION_BY_ID[state.filter].label;
        $('list-count').textContent = `${ids.filter(id => state.filter === 'ALL' || METRICS[id].cat === state.filter).length} tracked here`;
        let html = '';
        regions.forEach(r => {
            const mine = ids.filter(id => METRICS[id].cat === r.id);
            if (!mine.length) return;
            html += `<div class="metric-group"><span>${esc(r.label)}</span><span>${mine.length}</span></div>`;
            mine.forEach(id => {
                const m = METRICS[id], res = evalOf(id);
                const val = res.state === 'stale' ? '***' : (res.state === 'ok' ? formatValue(res.value, m) : '--');
                const f = res.state === 'ok' ? forecastArrow(m) : '';
                const statusText = res.state === 'ok' ? TIER_LABEL[res.tier] : (res.state === 'stale' ? 'Data stale' : 'No reading yet');
                html += `<button type="button" class="metric-row${id === state.selected ? ' is-selected' : ''}" data-select="${id}"${id === state.selected ? ' aria-current="true"' : ''}>
                    ${iconFor(res)}<span class="metric-name">${esc(m.name)}<span class="sr-only"> — ${statusText}</span></span>
                    <span class="metric-value">${val}<small>${esc(m.unit)}</small>${f}</span></button>`;
            });
        });
        $('metric-list').innerHTML = html || '<p class="small muted" style="padding:16px">Nothing tracked for this area here.</p>';
    }
    function forecastArrow(m) {
        const vals = m.history.slice(-3).map(h => h.v);
        if (vals.length < 3 || m.stale) return '';
        if (vals[0] < vals[1] && vals[1] < vals[2]) return '<span class="trend" title="Rising 3 days in a row">↗</span>';
        if (vals[0] > vals[1] && vals[1] > vals[2]) return '<span class="trend" title="Falling 3 days in a row">↘</span>';
        return '';
    }

    function selectMetric(id, opts = {}) {
        if (!METRICS[id]) return;
        if (state.filter !== 'ALL' && METRICS[id].cat !== state.filter) state.filter = 'ALL';
        state.selected = id;
        if (opts.render !== false) render();
        if (opts.scroll && window.innerWidth < 960) $('inspector').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* ---------------------------------------------------------- inspector */
    let chart = null;
    function renderInspector() {
        const m = METRICS[state.selected];
        const res = evalOf(m.id);
        const zone = safeZone(m, ctx());
        const region = REGION_BY_ID[m.cat];

        $('inspect-eyebrow').innerHTML = `${ICONS[regionStatus(m.cat).status] || ''}<span>${esc(region.label)}</span><span class="faint">·</span><span>${esc(env().short)}</span>`;
        $('inspect-title').textContent = m.name;
        $('inspect-badge').innerHTML = badgeHTML(res);
        if (res.state === 'ok') {
            $('inspect-readout').innerHTML = `${formatValue(res.value, m)}<small>${esc(m.unit)}</small>`;
            const last = m.history[m.history.length - 1];
            $('inspect-readout-sub').textContent = `Level ${res.level} of 7 · ${LEVEL_NAMES[res.level]} · ${dayKey(last.t) === dayKey() ? 'today' : fmtDate(last.t)}`;
        } else {
            $('inspect-readout').innerHTML = `${res.state === 'stale' ? '***' : '--'}<small>${esc(m.unit)}</small>`;
            $('inspect-readout-sub').textContent = res.state === 'stale' ? 'Sensor signal stalled' : 'No reading yet';
        }

        // 7-level gauge
        const b = zone.bands;
        const lowNA = !b.low, highNA = !b.high;
        const segNA = (l) => (l < 4 && (lowNA || (l === 1 && b.low[0] === -Infinity) || (l === 2 && b.low[0] === b.low[1]))) ||
                             (l > 4 && (highNA || (l === 7 && b.high[2] === Infinity) || (l === 6 && b.high[1] === b.high[2])));
        let segs = '', labels = '';
        for (let l = 1; l <= 7; l++) {
            const cur = res.state === 'ok' && res.level === l;
            segs += `<div class="gauge-seg l${l}${segNA(l) ? ' is-na' : ''}${cur ? ' is-current' : ''}"></div>`;
            labels += `<span class="${cur ? 'is-current' : ''}">${LEVEL_NAMES[l]}</span>`;
        }
        $('inspect-gauge').innerHTML = `<div class="gauge-track">${segs}</div><div class="gauge-labels">${labels}</div>`;

        $('inspect-zone').textContent = `Safe zone: ${zone.text}`;
        $('inspect-source').textContent = `Source: ${zone.src}`;
        document.querySelectorAll('#range-seg button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.range === state.range)));

        const fc = forecast7(m, ctx());
        renderChart(m, fc, zone);
        renderEarlyWarning(m, res, fc);

        $('log-label').textContent = `Log today's reading for ${m.name}`;
        $('log-unit').textContent = m.unit;
        $('log-value').step = m.decimals ? String(Math.pow(10, -m.decimals)) : '1';

        renderActions(m, res);
        renderExplain(m, res, zone);
    }

    const corridorPlugin = {
        id: 'corridor',
        beforeDatasetsDraw(c, args, opts) {
            const { ctx: g, chartArea: a, scales } = c;
            if (!a || !scales.y) return;
            const top = opts.max === null ? a.top : Math.max(a.top, scales.y.getPixelForValue(opts.max));
            const bottom = opts.min === null ? a.bottom : Math.min(a.bottom, scales.y.getPixelForValue(opts.min));
            if (bottom <= top) return;
            g.save();
            g.fillStyle = 'rgba(18, 183, 106, 0.09)';
            g.fillRect(a.left, top, a.right - a.left, bottom - top);
            g.strokeStyle = 'rgba(18, 183, 106, 0.55)'; g.lineWidth = 1; g.setLineDash([4, 4]);
            g.beginPath();
            if (opts.max !== null) { g.moveTo(a.left, top); g.lineTo(a.right, top); }
            if (opts.min !== null) { g.moveTo(a.left, bottom); g.lineTo(a.right, bottom); }
            g.stroke();
            if (opts.forecastFrom !== null) {
                const x = scales.x.getPixelForValue(opts.forecastFrom);
                g.fillStyle = opts.breach ? 'rgba(247, 144, 9, 0.07)' : 'rgba(16, 24, 40, 0.025)';
                g.fillRect(x, a.top, a.right - x, a.bottom - a.top);
            }
            g.restore();
        }
    };

    function renderChart(m, fc, zone) {
        const empty = $('chart-empty');
        const cutoff = state.range === 'all' ? -Infinity : noonOf() - (parseInt(state.range, 10) - 1) * DAY_MS - DAY_MS / 2;
        const rows = m.history.filter(h => h.t >= cutoff);
        if (chart) { chart.destroy(); chart = null; }
        if (typeof Chart === 'undefined') { empty.hidden = false; empty.textContent = 'The chart library could not load.'; return; }
        if (!rows.length) {
            empty.hidden = false;
            empty.innerHTML = m.history.length
                ? '<p>No readings in this time range. Try a longer range.</p>'
                : '<div class="stack" style="align-items:center"><p>No readings yet. Log one below or use today\'s check-ins.</p><button type="button" class="btn btn-secondary btn-sm" data-demo-log>Load 45-day demo mission log</button></div>';
            return;
        }
        empty.hidden = true;
        const showFc = fc.ok && !m.stale;
        const labels = rows.map(h => dayKey(h.t) === dayKey() ? 'Today' : fmtDate(h.t));
        const values = rows.map(h => h.v);
        const fcLabels = showFc ? Array.from({ length: 7 }, (_, i) => `+${i + 1}d`) : [];
        const data = showFc ? [...values, ...Array(7).fill(null)] : values;
        const proj = showFc ? [...Array(values.length - 1).fill(null), values[values.length - 1], ...fc.projected] : [];
        const finite = (v) => v !== null && isFinite(v);
        const all = [...values, ...(showFc ? fc.projected : []), zone.min, zone.max].filter(finite);
        let lo = Math.min(...all), hi = Math.max(...all);
        const pad = Math.max((hi - lo) * 0.15, Math.abs(hi) * 0.02, m.decimals >= 3 ? 0.002 : 0.4);
        lo -= pad; hi += pad;
        if (Math.min(...values) >= 0 && lo < 0) lo = 0;
        const breach = showFc && fc.breach;

        chart = new Chart($('trend-chart').getContext('2d'), {
            type: 'line',
            data: {
                labels: [...labels, ...fcLabels],
                datasets: [
                    { label: m.name, data, borderColor: COLORS.accent, backgroundColor: withAlpha(COLORS.accent, 0.1), fill: true, borderWidth: 2.5, tension: 0.3,
                      pointRadius: rows.length > 40 ? 0 : 2.5, pointHoverRadius: 4, pointBackgroundColor: COLORS.surface, pointBorderColor: COLORS.accent, spanGaps: false },
                    ...(showFc ? [{ label: '7-day forecast', data: proj, borderColor: breach ? COLORS.warn : COLORS.text2, borderDash: [6, 4], borderWidth: 2,
                        pointRadius: 2, pointBackgroundColor: breach ? COLORS.warn : COLORS.text2, fill: false, tension: 0 }] : [])
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    corridor: { min: zone.min, max: zone.max, forecastFrom: showFc ? values.length - 1 : null, breach },
                    tooltip: {
                        backgroundColor: COLORS.surface, borderColor: COLORS.line, borderWidth: 1, titleColor: COLORS.text, bodyColor: COLORS.text2, padding: 10, cornerRadius: 10,
                        filter: (item) => item.raw !== null && item.raw !== undefined,
                        callbacks: { label: (c) => `${c.dataset.label}: ${formatNumber(c.raw, m.decimals)} ${m.unit}` }
                    }
                },
                scales: {
                    x: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text3, maxTicksLimit: window.innerWidth < 600 ? 5 : 9, font: { family: cssVar('--font'), size: 11, weight: '600' } } },
                    y: { min: lo, max: hi, grid: { color: COLORS.grid }, ticks: { color: COLORS.text3, maxTicksLimit: 6, font: { family: cssVar('--font'), size: 11, weight: '600' },
                        callback: (v) => formatNumber(v, Math.min(m.decimals, 3)) } }
                }
            },
            plugins: [corridorPlugin]
        });
    }

    function renderEarlyWarning(m, res, fc) {
        const el = $('early-warning');
        const parts = [];
        if (res.state === 'stale') parts.push('<div class="callout"><b>Forecast paused:</b> the sensor signal is stale. Check contact or sync, then log a fresh reading.</div>');
        if (res.persistNote) parts.push(`<div class="callout is-warn"><b>Watching:</b> ${esc(res.persistNote)}</div>`);
        if (res.state === 'ok' && !fc.ok) parts.push(`<div class="callout">Building your personal baseline — the 7-day forecast starts after 3 readings (<span class="num">${fc.have} / 3</span>).</div>`);
        if (fc.ok && fc.breach && res.state === 'ok') {
            const sign = fc.slope >= 0 ? '+' : '';
            parts.push(`<div class="callout is-warn"><b>Early drift warning:</b> moving <span class="num">${sign}${formatNumber(fc.slope, Math.max(m.decimals, 2))} ${esc(m.unit)}/day</span>, ${esc(m.name)} will reach <b>${TIER_LABEL[fc.breach.tier]}</b> in <span class="num">${fc.breach.day}</span> ${fc.breach.day === 1 ? 'day' : 'days'} if nothing changes${res.tier === 'GREEN' ? ' — even though today still looks fine' : ''}.</div>`);
        }
        el.innerHTML = parts.join('');
    }

    /* ------------------------------------------------------------ actions */
    const KIT_RULES = [
        { tag: 'lbnp', re: /LBNP|leg vacuum/i, text: 'The leg vacuum (LBNP) isn\'t on board here — lie down with your legs raised, cut salt, and use it when you are back at base.' },
        { tag: 'ared', re: /ARED|gym/i, text: 'No gym rig here — do bodyweight squats and resistance-band work until you are back.' },
        { tag: 'ultrasound', re: /ultrasound|Doppler/i, text: 'No ultrasound here — note your symptoms and get scanned as soon as you reach a med bay.' },
        { tag: 'shelter', re: /storm shelter/i, text: 'No storm shelter here — get behind the thickest shielding you have (water and food stores) and head back.' },
        { tag: 'ki', re: /\bKI\b|potassium iodide/i, text: 'No KI tablets here — return to the habitat medical stock.' },
        { tag: 'scrubbers', re: /scrubber/i, text: 'No backup scrubbers here — switch to suit or mask oxygen and head back.' },
        { tag: 'surgeon', re: /Flight Surgeon/i, text: 'There is no live Flight Surgeon link right now — the Crew Medical Officer decides, and the app logs everything to send to Earth.' }
    ];
    function kitNotes(text) {
        const kit = env().kit;
        return KIT_RULES.filter(r => r.re.test(text) && !kit.includes(r.tag)).map(r => r.text);
    }

    function medGuards(id, res) {
        if (res.state !== 'ok' || res.tier === 'GREEN') return [];
        const h = state.profile.medHistory, out = [];
        if (id === 'cramping_pain' && h.nsaidAllergy) out.push('Safety check: NSAID sensitivity on file — avoid ibuprofen. Use acetaminophen, a heat pack and gentle stretching instead.');
        if (id === 'perchlorate' && res.tier === 'RED' && h.iodineAllergy) out.push('Safety check: iodine sensitivity on file — ask the Flight Surgeon before taking potassium iodide (KI).');
        if (['ferritin', 'hemoglobin'].includes(id) && h.anemia) out.push('History note: low iron / anemia on file — favor iron-rich meals and closer blood checks.');
        if (['bmd', 'calcium', 'sodium_intake', 'protein_intake'].includes(id) && (h.osteopenia || h.kidneyStones)) out.push('History note: bone or kidney-stone history on file — keep salt under 3,000 mg a day and keep up gym workouts.');
        if (['onsd', 'iop', 'sodium_intake'].includes(id) && h.sans) out.push('History note: eye-pressure sensitivity (SANS) on file — prioritize daily leg vacuum (LBNP) sessions and low-salt meals.');
        if (['ijv', 'pill_missed', 'breakthrough_days'].includes(id) && h.clottingFactor) out.push('History note: clotting risk on file — get a Doppler check and tell the Flight Surgeon.');
        if (['menstrual_flow', 'cramping_pain'].includes(id) && h.pcosEndo) out.push('History note: PCOS / endometriosis on file — heavier bleeding and pain are more likely; log every day.');
        return out;
    }

    function exerciseFor(m, res) {
        if (res.state !== 'ok' || res.tier === 'GREEN') return null;
        if (m.id === 'stress' || m.id === 'resp_rate' || (m.id === 'blood_co2' && res.direction === 'low')) return 'breathing';
        if (m.id === 'journal_sentiment') return res.tier === 'RED' ? 'connect' : 'reframe';
        if (['kss', 'sleep', 'sleep_eff', 'hrv'].includes(m.id)) return 'release';
        return null;
    }
    function exerciseHTML(key) {
        const ex = CBT_EXERCISES[key];
        const note = isAutonomous() ? `<p class="small muted" style="margin-top:6px">Runs fully on board — Earth is ${delayMinutes()} minutes away.</p>` : '';
        return `<div class="exercise"><h4>Try this: ${esc(ex.title)}</h4><ol>${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${note}</div>`;
    }

    function renderActions(m, res) {
        const ids = activeIds();
        let html = '';
        let drift = 0;
        const reds = [];
        ids.forEach(id => {
            if (id === m.id) return;
            const r = evalOf(id);
            if (r.state !== 'ok') return;
            if (r.tier === 'RED') reds.push(id);
            else if (r.tier === 'YELLOW') drift++;
        });
        reds.slice(0, 3).forEach(id => { html += `<button type="button" class="alert-link" data-select="${id}"><span>Critical: ${esc(METRICS[id].name)}</span><span>View →</span></button>`; });
        if (reds.length > 3) html += `<p class="small muted">+ ${reds.length - 3} more Critical reading${reds.length - 3 > 1 ? 's' : ''} — marked with a red octagon in the list.</p>`;
        $('actions-hint').textContent = drift ? `${drift} other reading${drift > 1 ? 's' : ''} in Drift` : '';

        if (res.state === 'stale') html += '<div class="callout">Check the sensor contact or wireless sync, then log a fresh reading.</div>';
        else if (res.state === 'empty') html += `<div class="callout">No reading yet for <b>${esc(m.name)}</b>. See "How to measure" below, then log it above.</div>`;
        else if (res.tier === 'GREEN') html += '<div class="callout is-ok">Normal — cleared for spacewalks and normal duties.</div>';
        else {
            const dir = res.direction;
            const action = m.actions[dir], diet = m.diet[dir];
            if (res.tier === 'RED') {
                html += isAutonomous()
                    ? `<div class="callout is-crit"><b>Self-guided mode:</b> Earth is ${delayMinutes()} minutes away. Start these steps now — don't wait for ground. The Crew Medical Officer leads, and upcoming EVAs are on hold.</div>`
                    : '<div class="callout is-crit"><b>Call the Flight Surgeon</b> on the live link while you start these steps.</div>';
            }
            medGuards(m.id, res).forEach(g => { html += `<div class="callout is-warn">${linkTerms(g)}</div>`; });
            if (action) {
                html += `<div class="action is-${res.tier}"><div class="action-head"><b>Do this</b>${badgeHTML(res)}</div><p>${linkTerms(action)}</p>${res.tier === 'RED' ? twoStepHTML(m.id) : ''}</div>`;
            }
            kitNotes(`${action || ''} ${diet || ''}`).forEach(n => { html += `<div class="callout is-info"><b>${esc(env().short)}:</b> ${linkTerms(n)}</div>`; });
            if (diet) html += `<div class="action"><div class="action-head"><b>Food &amp; water</b></div><p>${linkTerms(diet)}</p></div>`;
            const ex = exerciseFor(m, res);
            if (ex) html += exerciseHTML(ex);
        }
        $('actions').innerHTML = html;
    }

    function twoStepHTML(id) {
        const done = state.executed[id] ? `<div class="small" style="margin-top:8px;color:var(--ok)">Done &amp; logged at <span class="num">${esc(state.executed[id])}</span>.</div>` : '';
        if (!state.armed[id]) return `<div class="two-step"><span>Two-step safety lock</span><button class="btn btn-warn btn-sm" type="button" data-step="arm" data-id="${id}">Start countermeasure</button></div>${done}`;
        return `<div class="two-step"><span><b>Armed</b> — confirm once it is done</span><span class="row"><button class="btn btn-secondary btn-sm" type="button" data-step="cancel" data-id="${id}">Cancel</button><button class="btn btn-danger btn-sm" type="button" data-step="confirm" data-id="${id}">Confirm &amp; log</button></span></div>${done}`;
    }

    function renderExplain(m, res, zone) {
        let today;
        const v = res.state === 'ok' ? `${formatValue(res.value, m)} ${m.unit}` : '';
        if (res.state === 'stale') today = 'The sensor signal stalled. Check the physical contact or wireless sync, then log a fresh reading.';
        else if (res.state === 'empty') today = 'No reading yet. Log one in the box above, use today\'s check-ins, or load the demo mission log from the Mission tab.';
        else if (res.tier === 'GREEN') today = `Today's ${v} is inside your safe zone (${zone.text}). You're cleared for normal duties.`;
        else if (res.tier === 'RED') today = `${v} is far outside safe limits (${LEVEL_NAMES[res.level].toLowerCase()}). Follow "What to do now" right away.`;
        else today = `${v} is ${res.direction === 'low' ? 'below' : 'above'} your safe zone (${zone.text}). It's not dangerous yet${res.priority ? ', but it is in the high-priority part of Drift — act today' : ' — take the simple steps early'}.`;
        $('explain-today').textContent = today;
        $('explain-why').innerHTML = linkTerms(m.definition);
        $('explain-pic').innerHTML = METHOD_PICTURES[m.method] || '';
        $('explain-how').innerHTML = m.how.map(s => `<li>${linkTerms(s)}</li>`).join('');
    }

    /* ============================================================== TODAY */
    const GYN_CHECKIN = ['menstrual_flow', 'cramping_pain', 'pill_missed', 'breakthrough_days', 'sexual_oxytocin'];
    function tasks() {
        const sex = state.profile.sexMode;
        const vitaminsText = sex === 'FEMALE_CYCLE' ? 'Take vitamin D3, electrolytes & iron ration' : 'Take vitamin D3 & electrolytes';
        const list = [
            { id: 'food', title: 'Log today\'s meals', sub: 'Scan pouches in the Food tab', done: loggedToday(DIET_METRICS), label: 'Open food log' },
            { id: 'mind', title: 'Mind & sleep check-in', sub: 'Sleep, sleepiness and stress · 30 s', done: loggedToday(['kss', 'stress']), label: 'Check in' },
            { id: 'pvt', title: 'Reaction test', sub: '1-minute focus test', done: loggedToday(['pvt']), label: 'Start' },
            { id: 'vitamins', title: vitaminsText, sub: 'Tick when done', done: state.manual.date === dayKey() && state.manual.vitamins, label: 'Mark done', manual: true }
        ];
        if (sex !== 'MALE') list.splice(3, 0, { id: 'cycle', title: 'Cycle & comfort check-in', sub: sex === 'FEMALE_CYCLE' ? 'Flow, cramps and comfort' : 'Pill, bleeding and cramps', done: loggedToday(GYN_CHECKIN), label: 'Log' });
        return list;
    }

    function streakView() {
        const s = state.streak, today = dayKey(), yest = dayKey(Date.now() - DAY_MS);
        if (s.last === today) return { count: s.count, note: 'Done for today — nice work!' };
        if (s.last === yest) return { count: s.count, note: 'Finish today\'s check-ins to keep it going' };
        if (s.last && state.freeze) return { count: s.count, note: 'Protected by busy / spacewalk mode' };
        return { count: 0, note: s.last ? 'Streak reset — start a new one today' : 'Finish today\'s check-ins to start one' };
    }

    let rewardTimer = null;
    function completeDayIfDone(list) {
        if (!list.every(t => t.done)) return;
        const s = state.streak, today = dayKey(), yest = dayKey(Date.now() - DAY_MS);
        if (s.last === today) return;
        s.count = (s.last === yest || (state.freeze && s.last)) ? s.count + 1 : 1;
        s.last = today;
        s.days = uniq([...(s.days || []), today]).slice(-60);
        const banner = $('reward-banner');
        banner.textContent = `All check-ins done! Your streak is now ${s.count} day${s.count > 1 ? 's' : ''}.`;
        banner.hidden = false;
        clearTimeout(rewardTimer);
        rewardTimer = setTimeout(() => { banner.hidden = true; }, 6000);
    }

    function renderToday() {
        const list = tasks();
        completeDayIfDone(list);
        const done = list.filter(t => t.done).length;
        $('checkin-count').textContent = `${done} / ${list.length}`;
        const left = list.length - done;
        ['nav-badge-today', 'bell-badge'].forEach(id => { $(id).hidden = !left; $(id).textContent = left; });
        $('checkin-progress').style.width = `${(done / list.length) * 100}%`;
        $('tasks').innerHTML = list.map(t => `<li class="task${t.done ? ' is-done' : ''}">
            <span class="task-mark" aria-hidden="true">${t.done ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>' : ''}</span>
            <span class="task-text"><b>${esc(t.title)}</b><span>${t.done ? 'Done today' : esc(t.sub)}</span></span>
            ${t.manual ? `<button class="btn btn-secondary btn-sm" type="button" data-task="${t.id}" aria-pressed="${t.done}">${t.done ? 'Undo' : t.label}</button>`
                       : (t.done ? '' : `<button class="btn btn-secondary btn-sm" type="button" data-task="${t.id}">${t.label}</button>`)}
        </li>`).join('');

        const sv = streakView();
        $('streak-count').textContent = sv.count;
        $('streak-note').textContent = sv.note;
        const days = new Set(state.streak.days || []);
        $('streak-week').innerHTML = Array.from({ length: 7 }, (_, i) => {
            const t = Date.now() - (6 - i) * DAY_MS, k = dayKey(t);
            return `<span class="${days.has(k) ? 'is-done' : ''}${i === 6 ? ' is-today' : ''}" title="${fmtDate(t)}"><i></i>${new Date(t).toLocaleDateString('en-US', { weekday: 'narrow' })}</span>`;
        }).join('');

        $('freeze-toggle').checked = state.freeze;
        $('freeze-desc').textContent = state.freeze ? 'On: streak protected and today\'s workout target lowered by 15%.' : 'Protects your streak and lowers today\'s workout by 15%.';
        $('reminder-time').value = state.reminder.time;
        $('notify-toggle').checked = state.reminder.notify;
        updateReminder(list);

        const sex = state.profile.sexMode;
        $('cycle-card').hidden = sex === 'MALE';
        $('cycle-natural').hidden = sex !== 'FEMALE_CYCLE';
        $('cycle-suppressed').hidden = sex !== 'FEMALE_SUPPRESSED';
        $('cycle-mode-hint').textContent = sex === 'FEMALE_CYCLE' ? 'Mode B · natural cycle' : 'Mode A · suppression';
        renderJournalEntries();
    }

    function updateReminder(list = tasks()) {
        const left = list.filter(t => !t.done).length;
        const banner = $('reminder-banner');
        if (!left) { banner.hidden = true; return; }
        const [hh, mm] = (state.reminder.time || '19:00').split(':').map(Number);
        const due = new Date(); due.setHours(hh || 0, mm || 0, 0, 0);
        const late = Date.now() >= due.getTime();
        banner.hidden = false;
        banner.textContent = late
            ? `Reminder: ${left} check-in${left > 1 ? 's' : ''} left today — about 2 minutes to keep your streak alive.`
            : `${left} quick check-in${left > 1 ? 's' : ''} to go today. You've got this.`;
        if (late && state.reminder.notify && state.reminder.lastNotified !== dayKey() && 'Notification' in window && Notification.permission === 'granted') {
            try { new Notification('A.R.T.E.M.I.S. check-in', { body: banner.textContent }); } catch { /* some browsers need a service worker */ }
            state.reminder.lastNotified = dayKey();
            saveState();
        }
    }

    function previousRun(id) {
        const h = METRICS[id].history.filter(r => dayKey(r.t) !== dayKey());
        const last = h[h.length - 1];
        return last && dayKey(last.t) === dayKey(Date.now() - DAY_MS) ? last.v : 0;
    }

    function renderJournalEntries() {
        const entries = state.journal.slice(-3).reverse();
        $('journal-entries').innerHTML = entries.map(e => {
            const tone = e.score >= 0.2 ? 'Positive' : (e.score <= -0.2 ? 'Negative' : 'Neutral');
            const share = e.privacy === 'share' ? (isAutonomous() ? 'Queued for flight surgeon' : 'Shared with flight surgeon') : 'Private';
            return `<li><div class="row-between"><span>${fmtDate(e.t)} · ${fmtTime(e.t)}</span><span>${share} · ${tone}</span></div><p>${esc(e.text)}</p></li>`;
        }).join('');
    }

    /* --------------------------------------------------------------- PVT */
    const pvt = { len: 60, running: false, endAt: 0, trials: [], lapses: 0, falseStarts: 0, phase: 'idle', stimAt: 0, timer: null, raf: 0, tick: null };
    function pvtSetBox(cls, big, small = '') {
        const box = $('pvt-box');
        box.className = `pvt-box${cls ? ' ' + cls : ''}`;
        box.innerHTML = `<div><div class="pvt-big">${big}</div>${small ? `<div class="small">${small}</div>` : ''}</div>`;
    }
    function pvtStats() {
        $('pvt-stats').textContent = pvt.trials.length ? `${pvt.trials.length} taps · ${pvt.lapses} slow · ${pvt.falseStarts} early` : '';
    }
    function pvtSchedule() {
        clearTimeout(pvt.timer);
        if (Date.now() >= pvt.endAt) return pvtFinish();
        pvt.phase = 'wait';
        pvtSetBox('', '…', 'Wait for amber');
        const isi = pvt.len >= 180 ? 2000 + Math.random() * 8000 : 2000 + Math.random() * 4000;
        pvt.timer = setTimeout(() => {
            pvt.phase = 'go'; pvt.stimAt = performance.now();
            pvtSetBox('is-go', '0', 'TAP!');
            const big = $('pvt-box').querySelector('.pvt-big');
            const tick = () => { if (pvt.phase !== 'go') return; big.textContent = Math.round(performance.now() - pvt.stimAt); pvt.raf = requestAnimationFrame(tick); };
            pvt.raf = requestAnimationFrame(tick);
            pvt.timer = setTimeout(() => { if (pvt.phase === 'go') pvtRespond(10000); }, 10000);
        }, isi);
    }
    function pvtRespond(forcedRt) {
        cancelAnimationFrame(pvt.raf);
        clearTimeout(pvt.timer);
        const rt = forcedRt || performance.now() - pvt.stimAt;
        if (rt < 100) { pvt.falseStarts++; }
        else { pvt.trials.push(rt); if (rt > 500) pvt.lapses++; }
        pvt.phase = 'feedback';
        pvtSetBox('', `${Math.round(rt)} ms`, rt > 500 ? 'Slow (lapse)' : 'Nice');
        pvtStats();
        pvt.timer = setTimeout(pvtSchedule, 700);
    }
    function pvtTap() {
        if (pvt.phase === 'idle' || pvt.phase === 'done') return pvtStart();
        if (pvt.phase === 'go') return pvtRespond();
        if (pvt.phase === 'wait') {
            clearTimeout(pvt.timer);
            pvt.falseStarts++;
            pvt.phase = 'feedback';
            pvtSetBox('is-early', 'Too early', 'Wait for amber');
            pvtStats();
            pvt.timer = setTimeout(pvtSchedule, 900);
        }
    }
    function pvtStart() {
        Object.assign(pvt, { running: true, trials: [], lapses: 0, falseStarts: 0, endAt: Date.now() + pvt.len * 1000 });
        $('pvt-setup').hidden = true;
        clearInterval(pvt.tick);
        pvt.tick = setInterval(() => {
            const left = Math.max(0, Math.ceil((pvt.endAt - Date.now()) / 1000));
            $('pvt-timer').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left`;
        }, 250);
        pvtStats();
        pvtSchedule();
    }
    function pvtFinish() {
        clearTimeout(pvt.timer); clearInterval(pvt.tick); cancelAnimationFrame(pvt.raf);
        pvt.phase = 'done'; pvt.running = false;
        $('pvt-timer').textContent = '';
        $('pvt-setup').hidden = false;
        const n = pvt.trials.length;
        if (!n) { pvtSetBox('', 'No taps', 'Tap to try again'); return; }
        const lapsePct = Math.round((pvt.lapses / n) * 100);
        const mean = Math.round(pvt.trials.reduce((a, b) => a + b, 0) / n);
        pvtSetBox('', `${lapsePct}% slow`, `${n} taps · average ${mean} ms · ${pvt.falseStarts} early — saved. Tap to run again.`);
        ingest({ pvt: lapsePct });
        pvt.lastMeanMs = mean;
    }
    function pvtAbort() {
        clearTimeout(pvt.timer); clearInterval(pvt.tick); cancelAnimationFrame(pvt.raf);
        pvt.phase = 'idle'; pvt.running = false;
        $('pvt-setup').hidden = false; $('pvt-timer').textContent = ''; $('pvt-stats').textContent = '';
        pvtSetBox('', 'Start', 'Tap here to begin');
    }
    const openPvt = () => { pvtAbort(); $('pvt-dialog').showModal(); $('pvt-box').focus(); };

    /* =============================================================== FOOD */
    function ensureMealsToday() {
        if (state.meals.date !== dayKey()) state.meals = { date: dayKey(), items: [], savedAt: null };
    }
    function mealTotals() {
        ensureMealsToday();
        const t = { kcal: 0, p: 0, c: 0, f: 0, fib: 0, na: 0, k: 0, mg: 0, fe: 0, i: 0, vc: 0, ml: 0 };
        state.meals.items.forEach(it => {
            const food = FOOD_BY_ID[it.id];
            if (!food) return;
            Object.keys(t).forEach(k => { t[k] += (food[k] || 0) * it.portion / 100; });
        });
        return t;
    }
    function galleyPlan() {
        const p = state.profile;
        const avoid = p.foodAllergies && p.foodAllergies.toLowerCase() !== 'none' ? ` · Avoid: ${p.foodAllergies}` : '';
        if (p.sexMode === 'FEMALE_CYCLE') return `${p.dietaryPreference} · 1,500 IU vitamin D3 + high-iron (18 mg+)${p.medHistory.anemia ? ' + extra iron' : ''}${avoid}`;
        return `${p.dietaryPreference} · 1,500 IU vitamin D3 + low-iron (8 mg cap)${avoid}`;
    }

    function meterHTML(label, value, target, unit, over = false) {
        const pct = target ? Math.min(100, (value / target) * 100) : 0;
        return `<div class="meter${over ? ' is-over' : ''}"><div class="meter-top"><span>${label}</span><b>${formatNumber(value, 0)} / ${formatNumber(target, 0)} ${unit}</b></div><div class="meter-bar"><i style="width:${pct}%"></i></div></div>`;
    }

    function renderFood() {
        const t = ctx().targets;
        $('t-active-badge').textContent = `${formatNumber(t.tActiveKcal, 0)} kcal/day`;
        $('t-active-breakdown').textContent = `Resting ${formatNumber(t.tBaseKcal, 0)} + exercise ${t.eExercise} + spacewalk ${t.eEva} = ${formatNumber(t.tActiveKcal, 0)} kcal`;
        $('exertion-ared').value = state.exertion.aredKg;
        $('exertion-treadmill').value = state.exertion.treadmillKm;
        $('exertion-eva').value = state.exertion.evaHours;

        ensureMealsToday();
        const tot = mealTotals();
        $('food-items').innerHTML = state.meals.items.map((it, i) => {
            const f = FOOD_BY_ID[it.id];
            return f ? `<li>${esc(f.name)}${it.portion !== 100 ? ` <span>${it.portion}%</span>` : ''}<button class="btn btn-ghost btn-sm" type="button" data-remove-food="${i}" aria-label="Remove ${esc(f.name)}">Remove</button></li>` : '';
        }).join('') || '<li class="muted" style="justify-content:center">Nothing logged yet today</li>';
        const iron = t.ironTarget;
        $('food-meters').innerHTML = [
            meterHTML('Calories', tot.kcal, t.tActiveKcal, 'kcal'),
            meterHTML('Protein', tot.p, t.proteinTargetG, 'g'),
            meterHTML('Water & drinks', tot.ml, t.fluidTargetMl, 'mL'),
            meterHTML('Salt (limit)', tot.na, t.sodiumCapMg, 'mg', tot.na > t.sodiumCapMg),
            meterHTML(iron.kind === 'min' ? 'Iron (at least)' : 'Iron (limit)', tot.fe, iron.mg, 'mg', iron.kind === 'max' && tot.fe > iron.mg)
        ].join('');
        $('food-saved').textContent = state.meals.savedAt ? `Saved at ${fmtTime(state.meals.savedAt)} — saving again replaces today's numbers.` : 'Nothing saved to your health log yet today.';

        const rows = [
            ['Daily calories', `${formatNumber(t.tActiveKcal, 0)} kcal`],
            ['Protein · carbs · fat', `${t.proteinTargetG} g · ${t.carbsTargetG} g · ${t.fatTargetG} g`],
            ['Water', `${formatNumber(t.fluidTargetMl, 0)} mL${state.profile.medHistory.kidneyStones ? ' (+500 kidney)' : ''}`],
            ['Salt limit', 'under 3,000 mg'],
            ['Iron', iron.kind === 'min' ? '18 mg or more' : '8 mg or less'],
            ['Workout load', state.freeze ? '85% (busy / EVA mode)' : '100% baseline'],
            ['Meal plan', galleyPlan()]
        ];
        $('targets').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd${k === 'Meal plan' ? ' class="kv-text"' : ''}>${esc(v)}</dd></div>`).join('');

        const alerts = [];
        activeIds().forEach(id => {
            const m = METRICS[id], r = evalOf(id);
            if (r.state !== 'ok' || r.tier === 'GREEN') return;
            const txt = m.diet[r.direction];
            if (txt) alerts.push(`<div class="callout ${r.tier === 'RED' ? 'is-crit' : 'is-warn'} small"><b>${esc(m.name)}:</b> ${linkTerms(txt)}</div>`);
        });
        $('diet-alerts').innerHTML = alerts.join('');
    }

    let partialArmed = false;
    function saveFoodLog() {
        const tot = mealTotals();
        if (tot.kcal <= 0 && tot.ml <= 0) { toast('Add at least one food or drink first.'); return; }
        const t = ctx().targets, w = state.profile.weightKg || 62;
        const pct = Math.round((tot.kcal / t.tActiveKcal) * 100);
        if (pct < 60 && !partialArmed) {
            partialArmed = true;
            $('btn-food-save').textContent = 'Save anyway';
            $('food-saved').textContent = `Today looks unfinished (${pct}% of your calories). These are whole-day totals, so saving now may raise alerts. Best after your last meal.`;
            setTimeout(() => { partialArmed = false; $('btn-food-save').textContent = 'Save day\'s totals to health log'; }, 6000);
            return;
        }
        partialArmed = false;
        $('btn-food-save').textContent = 'Save day\'s totals to health log';
        const data = { fluid_intake: Math.round(tot.ml) };
        if (tot.kcal > 0) Object.assign(data, {
            caloric_balance: +((tot.kcal / t.tActiveKcal) * 100).toFixed(1),
            carbs_pct: +((tot.c * 4 / tot.kcal) * 100).toFixed(1),
            fats_pct: +((tot.f * 9 / tot.kcal) * 100).toFixed(1),
            protein_intake: +(tot.p / w).toFixed(2),
            dietary_fiber: +tot.fib.toFixed(1), dietary_iron: +tot.fe.toFixed(1), sodium_intake: Math.round(tot.na),
            potassium_intake: Math.round(tot.k), magnesium_intake: Math.round(tot.mg), iodine_intake: Math.round(tot.i),
            vit_c_pct: Math.round((tot.vc / 90) * 100)
        });
        state.meals.savedAt = Date.now();
        ingest(data, { focus: 'caloric_balance' });
        toast('Food log saved to today\'s health readings.');
    }

    /* ============================================================ MISSION */
    function renderMission() {
        const e = env();
        $('loc-kit').innerHTML = `<b>Medical kit here:</b> ${esc(e.kitLabel)}`;
        $('loc-context').innerHTML = e.context.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${linkTerms(v)}</dd></div>`).join('');
        $('delay-control').hidden = !e.delay.adjustable;
        if (e.delay.adjustable) {
            $('delay-range').value = delayMinutes();
            $('delay-val').textContent = `${delayMinutes()} min`;
        }

        const p = state.profile, t = ctx().targets, h = p.medHistory;
        const flags = [];
        if (h.anemia) flags.push('Anemia history');
        if (h.osteopenia || p.bmdTScore <= -1.0) flags.push(`Low bone density (T ${p.bmdTScore})`);
        if (h.kidneyStones) flags.push('Kidney-stone risk');
        if (h.sans) flags.push('Eye-pressure sensitivity (SANS)');
        if (p.sexMode !== 'MALE' && h.pcosEndo) flags.push('PCOS / endometriosis');
        if (h.clottingFactor) flags.push('Clotting risk');
        if (h.nsaidAllergy) flags.push('NSAID sensitivity');
        if (h.iodineAllergy) flags.push('Iodine sensitivity');
        const mode = { FEMALE_CYCLE: `Natural cycle · day ${p.cycleDay} of ${p.cycleLengthDays} · ${p.flowBaseline} flow`, FEMALE_SUPPRESSED: `Cycle suppression · ${p.suppressionRegimen}`, MALE: 'Male' }[p.sexMode];
        $('profile-summary').innerHTML = `
            <div><b>${esc(p.astronautId)} · ${esc(p.name)}</b><br><span class="muted">${esc(p.role)}</span></div>
            <div class="num muted">${p.age}y · ${p.heightCm} cm · ${p.weightKg} kg · BMI ${t.bmi} · body fat ${p.bodyFatPct}% · HRV baseline ${p.hrvBaseline} ms</div>
            <div><b>Mode:</b> <span class="muted">${esc(mode)}</span></div>
            <div><b>Diet:</b> <span class="muted">${esc(p.dietaryPreference)} · allergies: ${esc(p.foodAllergies)}</span></div>
            <div><b>Medical flags:</b> <span style="color:${flags.length ? 'var(--warn)' : 'var(--ok)'}">${esc(flags.length ? flags.join(', ') : 'None on file')}</span></div>`;
    }

    /* ----------------------------------------------------- demo generator */
    function demoValue(id, back, rand) {
        const p = state.profile, sex = p.sexMode, m = METRICS[id];
        const L = p.cycleLengthDays || 28;
        const cycleDayAt = ((((p.cycleDay || 1) - 1 - back) % L) + L) % L + 1;
        switch (id) {
            case 'fluid_intake': return Math.round(ctx().targets.fluidTargetMl * (1.05 + rand() * 0.06));
            case 'hrv': return Math.round((p.hrvBaseline || 45) * (0.97 + rand() * 0.08));
            case 'menstrual_flow': return sex === 'FEMALE_CYCLE' ? ([3, 3, 2, 1, 1][cycleDayAt - 1] ?? 0) : 0;
            case 'cramping_pain': return sex === 'FEMALE_CYCLE' ? ([2, 3, 1][cycleDayAt - 1] ?? 0) : (rand() < 0.1 ? 1 : 0);
            case 'ferritin': return Math.round(66 - (44 - back) * 0.1);
            case 'pill_potency': return Math.round(99 - (44 - back) * 0.08);
            default: break;
        }
        let base = DEMO_BASELINES[id];
        if (id === 'dietary_iron') base = sex === 'FEMALE_CYCLE' ? DEMO_BASELINES.dietary_iron_cycle : DEMO_BASELINES.dietary_iron_low;
        if (id === 'calcium') base = state.env === '0.38g' ? DEMO_BASELINES.calcium_mars : DEMO_BASELINES.calcium_iss;
        if (!base) return null;
        const v = base[(44 - back) % 14];
        if (m.discrete) return v;
        const j = v * (1 + (rand() - 0.5) * 0.02);
        return +j.toFixed(Math.max(m.decimals, 1));
    }

    function loadMissionLog() {
        const rand = seededRandom(84);
        Object.keys(METRICS).forEach(id => {
            const m = METRICS[id];
            m.history = []; m.stale = false;
            for (let back = 45; back >= 1; back--) {
                const v = demoValue(id, back, rand);
                if (v !== null) m.history.push({ t: daysAgoNoon(back), v });
            }
        });
        state.armed = {}; state.executed = {};
        invalidate();
        state.selected = activeIds()[0];
        render();
        toast('Loaded a 45-day mission log (ending yesterday). Today\'s check-ins are still open.');
    }

    function scenario(kind) {
        invalidate();
        const sex = state.profile.sexMode, e = state.env, rand = seededRandom(7);
        const ids = activeIds();
        state.armed = {}; state.executed = {};
        if (kind === 'normal') {
            const data = {};
            ids.forEach(id => { const v = demoValue(id, 0, rand); if (v !== null) data[id] = v; });
            ingest(data, { focus: state.selected });
            toast('Normal scenario: every reading logged in its safe zone today.');
            return;
        }
        if (kind === 'drift') {
            let days;
            if (sex === 'FEMALE_CYCLE') days = [{ ferritin: 32, cramping_pain: 2, magnesium_intake: 280 }, { ferritin: 29, cramping_pain: 4, magnesium_intake: 245 }, { ferritin: 26, cramping_pain: 5, magnesium_intake: 215 }];
            else if (sex === 'FEMALE_SUPPRESSED') days = [{ pill_potency: 91, dietary_iron: 7, sodium_intake: 2950 }, { pill_potency: 88, dietary_iron: 10, sodium_intake: 3200 }, { pill_potency: 85, dietary_iron: 12, sodium_intake: 3450 }];
            else if (e === '0g_station' || e === '0g_transit') days = [{ onsd: 5.6, calcium: 375, sodium_intake: 2900 }, { onsd: 5.8, calcium: 395, sodium_intake: 3150 }, { onsd: 6.0, calcium: 415, sodium_intake: 3400 }];
            else if (e === '0.38g') days = [{ osmolality: 292, fluid_intake: 2100 }, { osmolality: 294, fluid_intake: 1900 }, { osmolality: 296, fluid_intake: 1750 }];
            else if (e === '0.166g_rover') days = [{ ortho: 86, fluid_intake: 2200 }, { ortho: 83, fluid_intake: 1950 }, { ortho: 81, fluid_intake: 1750 }];
            else days = [{ dust: 3.8, caloric_balance: 89 }, { dust: 4.3, caloric_balance: 84 }, { dust: 4.8, caloric_balance: 79 }];
            const mind = [{ sleep: 6.4, kss: 3 }, { sleep: 5.9, kss: 4 }, { sleep: 5.4, kss: 5 }];
            days.forEach((d, i) => ingest({ ...mind[i], ...d }, { t: daysAgoNoon(2 - i), defer: true }));
            const focus = Object.keys(days[2]).find(id => ids.includes(id));
            selectMetric(focus, { render: false });
            render();
            toast('Drift scenario: three days of readings slowly leaving the safe zone.');
            return;
        }
        let data;
        if (sex === 'FEMALE_CYCLE') data = { hemoglobin: 10.6, cramping_pain: 8, magnesium_intake: 180 };
        else if (sex === 'FEMALE_SUPPRESSED') data = { dietary_iron: 19, pill_missed: 3, sodium_intake: 3950 };
        else if (e === '0g_station' || e === '0g_transit') data = { onsd: 7.1, calcium: 525, sodium_intake: 3920 };
        else if (e === '0.38g') data = { perchlorate: 28.0, iodine_intake: 85 };
        else data = { emuco2: 8.2, caloric_balance: 70 };
        ingest(data);
        toast('Critical scenario injected for today.');
    }

    /* ---------------------------------------------------------- exports */
    const ENV_CODES = { '0g_station': 'ISS_MICROGRAVITY_0G', '0g_transit': 'DEEP_SPACE_TRANSIT_0G', '0.166g': 'LUNAR_SURFACE_0166G', '0.166g_rover': 'LUNAR_ROVER_0166G', '0.38g': 'MARS_SURFACE_038G' };
    const latest = (id) => { const h = METRICS[id] && METRICS[id].history; return h && h.length ? h[h.length - 1].v : null; };
    function overallTier() {
        let worst = 'GREEN';
        activeIds().forEach(id => { const r = evalOf(id); if (r.state !== 'ok') return; if (r.tier === 'RED') worst = 'RED'; else if (r.tier === 'YELLOW' && worst !== 'RED') worst = 'YELLOW'; });
        return worst;
    }

    function exportBackendSnapshot() {
        invalidate();
        const t = ctx().targets, p = state.profile, tier = overallTier();
        const lastJournal = state.journal[state.journal.length - 1];
        return {
            astronaut_id: p.astronautId, timestamp: new Date().toISOString(), mission_environment: ENV_CODES[state.env], comm_delay_minutes: delayMinutes(),
            demographics: { age: p.age, sex: p.sexMode === 'MALE' ? 'MALE' : 'FEMALE', weight_kg: p.weightKg, height_cm: p.heightCm, body_fat_pct: p.bodyFatPct },
            medical_history: { menses_mode: { FEMALE_SUPPRESSED: 'SUPPRESSED', FEMALE_CYCLE: 'NATURAL', MALE: 'N/A' }[p.sexMode], kidney_stone_history: p.medHistory.kidneyStones, sans_vulnerability: p.medHistory.sans },
            exertion_telemetry: { ared_workload_kg: state.exertion.aredKg, treadmill_km: state.exertion.treadmillKm, eva_hours: state.exertion.evaHours, eva_kcal_burn: t.eEva },
            dynamic_targets_computed: { t_base_kcal: t.tBaseKcal, t_active_kcal: t.tActiveKcal, protein_target_g: t.proteinTargetG, fluid_target_ml: t.fluidTargetMl, sodium_cap_mg: t.sodiumCapMg },
            intake_logged: { caloric_balance_pct: latest('caloric_balance'), protein_g_per_kg: latest('protein_intake'), sodium_mg: latest('sodium_intake'), iron_mg: latest('dietary_iron'), fluid_ml: latest('fluid_intake') },
            lab_telemetry: { serum_osmolality_mOsm_kg: latest('osmolality'), urine_specific_gravity: latest('usg'), serum_ferritin_ug_L: latest('ferritin'), hemoglobin_g_dL: latest('hemoglobin'), urinary_calcium_mg_24h: latest('calcium') },
            fatigue_testing: { pvt_lapse_rate_percent: latest('pvt'), mean_reaction_time_ms: pvt.lastMeanMs ?? null, karolinska_kss_score: latest('kss') },
            sleep_architecture: { total_sleep_hours: latest('sleep'), sleep_efficiency_percent: latest('sleep_eff'), deep_sws_percent: latest('deep_sleep'), rem_percent: latest('rem_sleep'), waso_minutes: latest('waso') },
            journal_reflection: lastJournal ? { entry_type: 'TEXT', privacy_mode: lastJournal.privacy === 'share' ? 'CLINICAL_SYNC' : 'CONFIDENTIAL_PERSONAL', nlp_sentiment_score: lastJournal.score } : null,
            status_calculated: { tier, readiness_score: readiness().score, status_label: { GREEN: 'NOMINAL_STABLE', YELLOW: 'CAUTION_DRIFT', RED: 'CRITICAL_ALERT' }[tier], eva_cleared: tier !== 'RED' }
        };
    }

    function exportMarsSnapshot() {
        invalidate();
        const ids = activeIds(), tier = overallTier();
        const phase = { '0.38g': 'MARS_SURFACE_038G', '0g_transit': 'DEEP_SPACE_TRANSIT' }[state.env] || ENV_CODES[state.env];
        const coords = viewer ? viewer.meshCoordinates() : {};
        const nodes = regionsForProfile().map(r => {
            const params = ids.filter(id => METRICS[id].cat === r.id).map(id => {
                const m = METRICS[id], res = evalOf(id), z = safeZone(m, ctx());
                return { parameter_name: m.name, current_value: res.state === 'ok' ? res.value : null, unit: m.unit, triage_level_1_to_7: res.state === 'ok' ? res.level : null, level_4_normal_green: z.text, citation: z.src };
            });
            const levels = params.filter(p => p.triage_level_1_to_7 !== null).map(p => p.triage_level_1_to_7);
            const worst = levels.length ? levels.reduce((a, b) => (Math.abs(b - 4) > Math.abs(a - 4) ? b : a), 4) : 4;
            const a = coords[r.id];
            return {
                node_id: r.key.toUpperCase(), anatomical_region: r.organ,
                mesh_coordinates: a || { x: 0, y: 0, z: 0 },
                triage_level_1_to_7: worst, triage_color_badge: tierOfLevel(worst), deviation_direction: worst < 4 ? 'LOW' : (worst > 4 ? 'HIGH' : 'NOMINAL'),
                linked_parameters: params
            };
        });
        return {
            system_metadata: { mission_id: 'ARTEMIS-DEMO', mission_phase: phase, utc_timestamp: new Date().toISOString(), system_status: { GREEN: 'NOMINAL', YELLOW: 'CAUTION', RED: 'CRITICAL' }[tier] },
            body_map_nodes: nodes,
            telemetry_payloads: {
                continuous_telemetry: { heart_rate_bpm: latest('heart_rate'), spo2_percent: latest('spo2'), respiratory_rate_rpm: latest('resp_rate') },
                periodic_lab_metrics: { blood_pco2_mmhg: latest('blood_co2'), urinary_calcium_mg_24h: latest('calcium'), oxidative_marker_8_ohdg_ng_mg_creatinine: latest('dust'), serum_osmolality_mosm_kg: latest('osmolality'), perchlorate_exposure_biomarker_ug_l: latest('perchlorate') },
                visual_diagnostics: { ultrasound_onsd_mm: latest('onsd'), ultrasound_ijv_velocity_cm_s: latest('ijv') },
                subjective_crew_logs: { pvt_lapse_rate_percent: latest('pvt'), sleep_duration_hours: latest('sleep'), subjective_fatigue_score_kss: latest('kss') }
            }
        };
    }

    function download(name, obj) {
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    /* ============================================================ PROFILE */
    const F = (id) => $(id);
    function syncProfileSections() {
        const mode = F('prof-sex-mode').value;
        F('prof-gyn-section').hidden = mode === 'MALE';
        F('hist-pcos-wrap').hidden = mode === 'MALE';
        document.querySelectorAll('[data-cycle-only]').forEach(el => { el.hidden = mode !== 'FEMALE_CYCLE'; });
        document.querySelectorAll('[data-suppressed-only]').forEach(el => { el.hidden = mode !== 'FEMALE_SUPPRESSED'; });
    }
    function fillProfileForm(p) {
        const set = (id, v) => { F(id).value = v; };
        set('prof-id', p.astronautId); set('prof-name', p.name); set('prof-age', p.age); set('prof-role', p.role);
        set('prof-height', p.heightCm); set('prof-weight', p.weightKg); set('prof-bodyfat', p.bodyFatPct); set('prof-bmd-tscore', p.bmdTScore);
        set('prof-sex-mode', p.sexMode); set('prof-hrv', p.hrvBaseline); set('prof-cycle-length', p.cycleLengthDays); set('prof-cycle-day', p.cycleDay);
        set('prof-flow-baseline', p.flowBaseline); set('prof-suppression-type', p.suppressionRegimen); set('prof-cramp-baseline', p.crampingBaseline);
        set('prof-diet', p.dietaryPreference); set('prof-allergies', p.foodAllergies);
        const h = p.medHistory;
        F('hist-anemia').checked = !!h.anemia; F('hist-osteopenia').checked = !!h.osteopenia; F('hist-kidney').checked = !!h.kidneyStones;
        F('hist-sans').checked = !!h.sans; F('hist-pcos').checked = !!h.pcosEndo; F('hist-clotting').checked = !!h.clottingFactor;
        F('hist-nsaid-allergy').checked = !!h.nsaidAllergy; F('hist-iodine-allergy').checked = !!h.iodineAllergy;
        syncProfileSections();
    }
    function readProfileForm() {
        const num = (id, d, min, max) => { const v = parseFloat(F(id).value); return isFinite(v) ? Math.min(max, Math.max(min, v)) : d; };
        const mode = F('prof-sex-mode').value;
        return {
            astronautId: F('prof-id').value.trim() || 'ASTRO-000', name: F('prof-name').value.trim() || 'Crew member',
            age: Math.round(num('prof-age', 34, 18, 80)), role: F('prof-role').value,
            heightCm: num('prof-height', 168, 120, 230), weightKg: num('prof-weight', 62, 35, 160), bodyFatPct: num('prof-bodyfat', 21.5, 5, 50),
            bmdTScore: num('prof-bmd-tscore', 0, -5, 4), sexMode: mode, hrvBaseline: Math.round(num('prof-hrv', 45, 10, 150)),
            cycleLengthDays: Math.round(num('prof-cycle-length', 28, 18, 60)), cycleDay: Math.round(num('prof-cycle-day', 1, 1, 60)),
            flowBaseline: F('prof-flow-baseline').value, suppressionRegimen: F('prof-suppression-type').value, crampingBaseline: F('prof-cramp-baseline').value,
            dietaryPreference: F('prof-diet').value, foodAllergies: F('prof-allergies').value.trim() || 'None',
            medHistory: {
                anemia: F('hist-anemia').checked, osteopenia: F('hist-osteopenia').checked, kidneyStones: F('hist-kidney').checked, sans: F('hist-sans').checked,
                pcosEndo: mode !== 'MALE' && F('hist-pcos').checked, clottingFactor: F('hist-clotting').checked,
                nsaidAllergy: F('hist-nsaid-allergy').checked, iodineAllergy: F('hist-iodine-allergy').checked
            }
        };
    }
    function applyProfile(p) {
        state.profile = mergeProfile(DEFAULT_PROFILE, p);
        saveProfile();
        invalidate();
        render();
    }
    const openProfile = () => { fillProfileForm(state.profile); $('profile-dialog').showModal(); };

    /* ============================================================ INGEST */
    function ingest(data, opts = {}) {
        if (!data || typeof data !== 'object') return;
        const t = opts.t ?? Date.now();
        const ids = activeIds();
        let focus = null, critical = null;
        Object.entries(data).forEach(([key, value]) => {
            const m = METRICS[key];
            if (!m) return;
            if (value === null) { m.stale = true; if (ids.includes(key)) focus = focus || key; return; }
            const num = typeof value === 'number' ? value : parseFloat(value);
            if (!isFinite(num)) return;
            upsertReading(m, num, t);
            if (ids.includes(key)) {
                focus = focus || key;
                if (!critical && evaluateValue(num, m, ctx()).tier === 'RED') critical = key;
            }
        });
        if (opts.defer) return;
        const next = critical || opts.focus || focus;
        if (next && ids.includes(next)) selectMetric(next, { render: false });
        render();
    }

    function ingestBackendSnapshot(snap) {
        if (!snap || typeof snap !== 'object') return;
        const envMap = Object.fromEntries(Object.entries(ENV_CODES).map(([k, v]) => [v, k]));
        if (snap.mission_environment && envMap[snap.mission_environment]) state.env = envMap[snap.mission_environment];
        if (typeof snap.comm_delay_minutes === 'number' && env().delay.adjustable) state.delay[state.env] = Math.round(snap.comm_delay_minutes);
        const demo = snap.demographics || {}, med = snap.medical_history || {};
        if (demo.sex || demo.age || med.menses_mode || snap.astronaut_id) {
            let sexMode = state.profile.sexMode;
            if (demo.sex === 'MALE') sexMode = 'MALE';
            else if (demo.sex === 'FEMALE') sexMode = med.menses_mode === 'SUPPRESSED' ? 'FEMALE_SUPPRESSED' : 'FEMALE_CYCLE';
            state.profile = mergeProfile(state.profile, {
                astronautId: snap.astronaut_id || state.profile.astronautId, age: demo.age ?? state.profile.age, weightKg: demo.weight_kg ?? state.profile.weightKg,
                heightCm: demo.height_cm ?? state.profile.heightCm, bodyFatPct: demo.body_fat_pct ?? state.profile.bodyFatPct, sexMode,
                medHistory: { kidneyStones: med.kidney_stone_history ?? state.profile.medHistory.kidneyStones, sans: med.sans_vulnerability ?? state.profile.medHistory.sans }
            });
            saveProfile();
        }
        const ex = snap.exertion_telemetry || {};
        state.exertion = {
            aredKg: ex.ared_workload_kg ?? state.exertion.aredKg, treadmillKm: ex.treadmill_km ?? state.exertion.treadmillKm,
            evaHours: ex.eva_hours ?? state.exertion.evaHours, evaKcalOverride: ex.eva_kcal_burn !== undefined ? ex.eva_kcal_burn : null
        };
        invalidate();
        const targets = ctx().targets, intake = snap.intake_logged || {}, lab = snap.lab_telemetry || {}, flat = {};
        const put = (k, v) => { if (v !== undefined && v !== null) flat[k] = v; };
        if (intake.calories_kcal) {
            put('caloric_balance', +((intake.calories_kcal / targets.tActiveKcal) * 100).toFixed(1));
            if (intake.carbs_g !== undefined) put('carbs_pct', +((intake.carbs_g * 4 / intake.calories_kcal) * 100).toFixed(1));
            if (intake.fat_g !== undefined) put('fats_pct', +((intake.fat_g * 9 / intake.calories_kcal) * 100).toFixed(1));
        }
        if (intake.protein_g !== undefined) put('protein_intake', +(intake.protein_g / (state.profile.weightKg || 62)).toFixed(2));
        [['sodium_mg', 'sodium_intake'], ['iron_mg', 'dietary_iron'], ['fiber_g', 'dietary_fiber'], ['fluid_ml', 'fluid_intake'], ['potassium_mg', 'potassium_intake'],
         ['magnesium_mg', 'magnesium_intake'], ['iodine_ug', 'iodine_intake']].forEach(([a, b]) => put(b, intake[a]));
        [['serum_osmolality_mOsm_kg', 'osmolality'], ['serum_ferritin_ug_L', 'ferritin'], ['urinary_calcium_mg_24h', 'calcium'], ['hemoglobin_g_dL', 'hemoglobin'],
         ['urine_specific_gravity', 'usg']].forEach(([a, b]) => put(b, lab[a]));
        // Mental-health spec payload
        const fat = snap.fatigue_testing || {}, sl = snap.sleep_architecture || {};
        put('pvt', fat.pvt_lapse_rate_percent); put('kss', fat.karolinska_kss_score);
        put('sleep', sl.total_sleep_hours); put('sleep_eff', sl.sleep_efficiency_percent); put('deep_sleep', sl.deep_sws_percent); put('rem_sleep', sl.rem_percent); put('waso', sl.waso_minutes);
        if (snap.journal_reflection) put('journal_sentiment', snap.journal_reflection.nlp_sentiment_score);
        // Mars spec payload
        const tp = snap.telemetry_payloads || {}, ct = tp.continuous_telemetry || {}, pl = tp.periodic_lab_metrics || {}, vd = tp.visual_diagnostics || {}, sc = tp.subjective_crew_logs || {};
        put('heart_rate', ct.heart_rate_bpm); put('spo2', ct.spo2_percent); put('resp_rate', ct.respiratory_rate_rpm);
        put('blood_co2', pl.blood_pco2_mmhg); put('calcium', pl.urinary_calcium_mg_24h); put('dust', pl.oxidative_marker_8_ohdg_ng_mg_creatinine);
        put('osmolality', pl.serum_osmolality_mosm_kg); put('perchlorate', pl.perchlorate_exposure_biomarker_ug_l);
        put('onsd', vd.ultrasound_onsd_mm); put('ijv', vd.ultrasound_ijv_velocity_cm_s);
        put('pvt', sc.pvt_lapse_rate_percent); put('sleep', sc.sleep_duration_hours); put('kss', sc.subjective_fatigue_score_kss);
        ingest(flat);
    }

    /* ============================================================ EVENTS */
    const PAGE_TITLES = { overview: 'Crew overview', today: "Today's check-ins", food: 'Food & targets', mission: 'Mission & data' };
    function switchPage(name) {
        if (!PAGE_TITLES[name]) name = 'overview';
        const changed = state.tab !== name;
        state.tab = name;
        document.querySelectorAll('.nav-btn[data-page]').forEach(b => { if (b.dataset.page === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
        document.querySelectorAll('.page').forEach(p => p.classList.toggle('is-active', p.id === `page-${name}`));
        $('page-title').textContent = PAGE_TITLES[name];
        if (changed) window.scrollTo({ top: 0 });
        if (name === 'overview' && chart) chart.resize();
        saveState();
    }
    const scrollToEl = (id) => $(id).scrollIntoView({ behavior: 'smooth', block: 'start' });

    let clearArmed = null;
    function wire() {
        $('env-selector').addEventListener('change', (e) => { state.env = e.target.value; invalidate(); render(); });
        $('btn-edit-profile').addEventListener('click', openProfile);
        $('btn-edit-profile-inline').addEventListener('click', openProfile);
        $('btn-all-systems').addEventListener('click', () => setFilter('ALL'));
        $('btn-glossary').addEventListener('click', () => { renderGlossary(''); $('glossary-dialog').showModal(); $('glossary-search').focus(); });

        // delegated clicks
        document.addEventListener('click', (e) => {
            const el = e.target.closest('[data-select],[data-region],[data-step],[data-task],[data-remove-food],[data-quick],[data-demo-log],[data-edit-profile],.term');
            if (!el) { hideTerm(e); return; }
            if (el.classList.contains('term')) { showTerm(el); return; }
            hideTerm(e);
            if (el.hasAttribute('data-demo-log')) loadMissionLog();
            else if (el.hasAttribute('data-edit-profile')) openProfile();
            else if (el.dataset.select) { if (state.tab !== 'overview') switchPage('overview'); selectMetric(el.dataset.select, { scroll: true }); }
            else if (el.dataset.region && el.classList.contains('region-item')) setFilter(el.dataset.region);
            else if (el.dataset.step) {
                const id = el.dataset.id;
                if (el.dataset.step === 'arm') state.armed[id] = true;
                if (el.dataset.step === 'cancel') state.armed[id] = false;
                if (el.dataset.step === 'confirm') { state.armed[id] = false; state.executed[id] = `${new Date().toISOString().slice(11, 19)} UTC`; toast('Countermeasure logged.'); }
                render();
            } else if (el.dataset.task) {
                const id = el.dataset.task;
                if (id === 'food') switchPage('food');
                else if (id === 'mind') { switchPage('today'); scrollToEl('mind-card'); }
                else if (id === 'pvt') openPvt();
                else if (id === 'cycle') { switchPage('today'); scrollToEl('cycle-card'); }
                else if (id === 'vitamins') {
                    const wasDone = state.manual.date === dayKey() && state.manual.vitamins;
                    state.manual = { date: dayKey(), vitamins: !wasDone };
                    render();
                }
            } else if (el.dataset.removeFood !== undefined) {
                state.meals.items.splice(parseInt(el.dataset.removeFood, 10), 1);
                render();
            } else if (el.dataset.quick) {
                ensureMealsToday();
                state.meals.items.push({ id: el.dataset.quick, portion: 100 });
                render();
                toast(`Added ${FOOD_BY_ID[el.dataset.quick].name}.`);
            }
        });

        // body viewer controls
        document.querySelectorAll('[data-layer]').forEach(inp => inp.addEventListener('change', () => {
            if (viewer) syncLayers(viewer.setLayer(inp.dataset.layer, inp.checked));
        }));
        document.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => viewer && viewer.preset(btn.dataset.preset)));
        document.querySelectorAll('[data-zoom]').forEach(btn => btn.addEventListener('click', () => viewer && viewer.zoom(parseInt(btn.dataset.zoom, 10))));
        $('btn-view-reset').addEventListener('click', () => viewer && viewer.reset());

        // inspector
        document.querySelectorAll('#range-seg button').forEach(btn => btn.addEventListener('click', () => { state.range = btn.dataset.range; render(); }));
        $('log-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const v = parseFloat($('log-value').value);
            if (!isFinite(v)) { toast('Enter a number first.'); return; }
            ingest({ [state.selected]: v }, { focus: state.selected });
            $('log-value').value = '';
            toast(`Logged ${formatValue(v, METRICS[state.selected])} ${METRICS[state.selected].unit}.`);
        });

        // tabs
        document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.addEventListener('click', () => switchPage(b.dataset.page)));
        $('btn-reminders').addEventListener('click', () => switchPage('today'));
        $('btn-theme').addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true));
        if (window.matchMedia) {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const follow = (e) => { let saved = null; try { saved = localStorage.getItem(THEME_KEY); } catch { /* ignore */ } if (!saved) applyTheme(e.matches ? 'dark' : 'light', false); };
            if (mq.addEventListener) mq.addEventListener('change', follow);
        }

        // today
        $('freeze-toggle').addEventListener('change', (e) => { state.freeze = e.target.checked; render(); });
        $('reminder-time').addEventListener('change', (e) => { state.reminder.time = e.target.value || '19:00'; state.reminder.lastNotified = null; render(); });
        $('notify-toggle').addEventListener('change', (e) => {
            if (!e.target.checked) { state.reminder.notify = false; saveState(); return; }
            if (!('Notification' in window)) { e.target.checked = false; toast('This browser does not support notifications.'); return; }
            Notification.requestPermission().then(p => {
                state.reminder.notify = p === 'granted';
                e.target.checked = state.reminder.notify;
                toast(state.reminder.notify ? 'Reminders on — the app must be open to send them.' : 'Notifications were blocked in the browser.');
                saveState();
            });
        });
        $('mind-kss').addEventListener('input', (e) => { $('mind-kss-val').textContent = e.target.value; });
        $('mind-stress').addEventListener('input', (e) => { $('mind-stress-val').textContent = e.target.value; });
        $('mind-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const sleep = parseFloat($('mind-sleep').value);
            const data = { kss: parseInt($('mind-kss').value, 10), stress: parseInt($('mind-stress').value, 10) };
            if (isFinite(sleep)) data.sleep = sleep;
            ingest(data, { focus: data.stress >= 4 ? 'stress' : 'sleep' });
            toast('Mind & sleep check-in saved.');
        });
        $('btn-wearable').addEventListener('click', () => {
            const r = seededRandom(Date.now() % 100000), b = state.profile.hrvBaseline || 45;
            const around = (lo, hi) => lo + r() * (hi - lo);
            ingest({
                sleep_eff: Math.round(around(84, 93)), deep_sleep: Math.round(around(16, 23)), rem_sleep: Math.round(around(19, 25)), waso: Math.round(around(10, 28)),
                hrv: Math.round(b * around(0.9, 1.08)), heart_rate: Math.round(around(56, 70)), spo2: Math.round(around(96, 99)), resp_rate: Math.round(around(12, 17))
            }, { focus: 'sleep_eff' });
            toast('Synced last night\'s wearable data (simulated).');
        });
        $('journal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const text = $('journal-text').value.trim();
            if (!text) { toast('Write a few words first.'); return; }
            const { score } = scoreJournalText(text);
            const privacy = document.querySelector('input[name="journal-privacy"]:checked').value;
            state.journal.push({ t: Date.now(), text, privacy, score });
            $('journal-text').value = '';
            const stress = latest('stress');
            let support = '';
            if (score <= -0.6) support = exerciseHTML('connect') + '<div style="height:8px"></div>' + exerciseHTML('reframe');
            else if (score <= -0.2 || (stress !== null && stress >= 4)) support = exerciseHTML(score <= -0.2 ? 'reframe' : 'breathing');
            else if (score >= 0.2) support = '<div class="callout is-ok small">Sounds like a good day. Entry saved.</div>';
            else support = '<div class="callout small">Entry saved.</div>';
            $('journal-support').innerHTML = support;
            ingest({ journal_sentiment: score }, { focus: 'journal_sentiment' });
        });
        $('cyc-cramp').addEventListener('input', (e) => { $('cyc-cramp-val').textContent = e.target.value; });
        $('cycle-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const sex = state.profile.sexMode, data = { cramping_pain: parseInt($('cyc-cramp').value, 10) };
            if (sex === 'FEMALE_CYCLE') data.menstrual_flow = Math.max(0, parseInt($('cyc-flow').value, 10) || 0);
            if (sex === 'FEMALE_SUPPRESSED') {
                const missed = document.querySelector('input[name="cyc-pill"]:checked').value === 'no';
                const bleed = document.querySelector('input[name="cyc-bleed"]:checked').value;
                data.pill_missed = missed ? previousRun('pill_missed') + 1 : 0;
                data.breakthrough_days = bleed === 'none' ? 0 : previousRun('breakthrough_days') + 1;
            }
            const comfort = $('cyc-comfort').value;
            if (comfort) data.sexual_oxytocin = parseInt(comfort, 10);
            ingest(data, { focus: 'cramping_pain' });
            toast('Cycle check-in saved.');
        });

        // pvt
        $('pvt-box').addEventListener('pointerdown', (e) => { e.preventDefault(); pvtTap(); });
        $('pvt-box').addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pvtTap(); } });
        document.querySelectorAll('[data-pvt-len]').forEach(btn => btn.addEventListener('click', () => {
            pvt.len = parseInt(btn.dataset.pvtLen, 10);
            document.querySelectorAll('[data-pvt-len]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        }));
        $('btn-close-pvt').addEventListener('click', () => $('pvt-dialog').close());
        $('pvt-dialog').addEventListener('close', pvtAbort);

        // food
        const sel = $('food-select');
        const groups = uniq(FOODS.map(f => f.group));
        sel.innerHTML = groups.map(g => `<optgroup label="${g}">${FOODS.filter(f => f.group === g).map(f => `<option value="${f.id}">${esc(f.name)} · ${f.kcal} kcal</option>`).join('')}</optgroup>`).join('');
        $('food-portion').addEventListener('input', (e) => { $('food-portion-val').textContent = `${e.target.value}%`; });
        $('btn-food-add').addEventListener('click', () => {
            ensureMealsToday();
            state.meals.items.push({ id: sel.value, portion: parseInt($('food-portion').value, 10) });
            render();
            toast(`Added ${FOOD_BY_ID[sel.value].name}.`);
        });
        $('btn-food-save').addEventListener('click', saveFoodLog);
        ['exertion-ared', 'exertion-treadmill', 'exertion-eva'].forEach(id => $(id).addEventListener('change', () => {
            state.exertion = {
                aredKg: Math.max(0, parseFloat($('exertion-ared').value) || 0), treadmillKm: Math.max(0, parseFloat($('exertion-treadmill').value) || 0),
                evaHours: Math.max(0, parseFloat($('exertion-eva').value) || 0), evaKcalOverride: null
            };
            invalidate(); render();
        }));

        // mission
        $('delay-range').addEventListener('input', (e) => { state.delay[state.env] = parseInt(e.target.value, 10); $('delay-val').textContent = `${e.target.value} min`; renderHeader(activeIds()); });
        $('delay-range').addEventListener('change', render);
        $('btn-load-log').addEventListener('click', loadMissionLog);
        $('btn-demo-normal').addEventListener('click', () => scenario('normal'));
        $('btn-demo-drift').addEventListener('click', () => scenario('drift'));
        $('btn-demo-critical').addEventListener('click', () => scenario('critical'));
        $('btn-export').addEventListener('click', () => download(`artemis-${state.profile.astronautId}-${dayKey()}.json`, exportBackendSnapshot()));
        $('btn-export-mars').addEventListener('click', () => download(`artemis-mars-spec-${dayKey()}.json`, exportMarsSnapshot()));
        $('btn-clear').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (!clearArmed) {
                btn.textContent = 'Click again to erase all readings, journal & streak';
                btn.classList.add('btn-danger'); btn.classList.remove('btn-ghost');
                clearArmed = setTimeout(() => { clearArmed = null; btn.textContent = 'Clear all logged data'; btn.classList.remove('btn-danger'); btn.classList.add('btn-ghost'); }, 4000);
                return;
            }
            clearTimeout(clearArmed); clearArmed = null;
            Object.values(METRICS).forEach(m => { m.history = []; m.stale = false; });
            Object.assign(state, { streak: { count: 0, last: null, days: [] }, manual: { date: null, vitamins: false }, journal: [], meals: { date: null, items: [], savedAt: null }, armed: {}, executed: {} });
            btn.textContent = 'Clear all logged data'; btn.classList.remove('btn-danger'); btn.classList.add('btn-ghost');
            render();
            toast('All logged data cleared. Your profile is kept.');
        });

        // profile dialog
        $('prof-sex-mode').addEventListener('change', syncProfileSections);
        document.querySelectorAll('[data-preset-profile]').forEach(btn => btn.addEventListener('click', () => fillProfileForm(mergeProfile(DEFAULT_PROFILE, PROFILE_PRESETS[btn.dataset.presetProfile]))));
        $('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            applyProfile(readProfileForm());
            $('profile-dialog').close();
            toast('Profile saved — targets and safe zones updated.');
        });
        $('btn-close-profile').addEventListener('click', () => $('profile-dialog').close());

        // glossary
        $('glossary-search').addEventListener('input', (e) => renderGlossary(e.target.value));
        $('btn-close-glossary').addEventListener('click', () => $('glossary-dialog').close());
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTerm(); });
        window.addEventListener('scroll', () => hideTerm(), { passive: true });

        // resize: chart tick density
        let rt = null;
        window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(renderInspector, 200); });
        setInterval(() => updateReminder(), 60000);
    }

    /* ---------------------------------------------------------- glossary */
    function renderGlossary(q) {
        const s = q.trim().toLowerCase();
        $('glossary-list').innerHTML = GLOSSARY.filter(g => !s || g.term.toLowerCase().includes(s) || g.def.toLowerCase().includes(s))
            .map(g => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.def)}</dd></div>`).join('') || '<p class="muted small">No matching terms.</p>';
    }
    function showTerm(el) {
        const g = GLOSSARY.find(x => x.term === el.dataset.term);
        if (!g) return;
        const pop = $('term-pop');
        pop.innerHTML = `<b>${esc(g.term)}</b>${esc(g.def)}`;
        pop.hidden = false;
        const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
        let left = Math.min(Math.max(8, r.left), window.innerWidth - pw - 8);
        let top = r.bottom + 6;
        if (top + ph > window.innerHeight - 8) top = r.top - ph - 6;
        pop.style.left = `${left}px`; pop.style.top = `${top}px`;
    }
    function hideTerm(e) {
        if (e && e.target && e.target.closest && e.target.closest('#term-pop')) return;
        $('term-pop').hidden = true;
    }

    /* =============================================================== INIT */
    function init() {
        applyTheme(currentTheme(), false);
        buildTermIndex();
        loadState();
        wire();
        switchPage(state.tab);

        const fallback = () => {
            $('body-fallback').hidden = false;
            $('stage-loading').hidden = true;
            document.querySelectorAll('.stage-tools, .stage-foot').forEach(el => { el.hidden = true; });
        };
        viewer = window.createBodyViewer ? window.createBodyViewer({
            canvas: $('body-canvas'), stage: $('body-stage'), hotspotLayer: $('body-hotspots'),
            regions: REGIONS, colors: COLORS, onSelect: setFilter,
            onLoad: (ok) => { if (!ok) fallback(); else render(); }
        }) : null;
        if (!viewer) { fallback(); $('body-canvas').hidden = true; }
        else viewer.load(window.ARTEMIS_BODY_GLB);

        render();
        if (!state.hasProfile) openProfile();
    }

    /* ======================================================= public API */
    window.getCrewProfile = () => JSON.parse(JSON.stringify(state.profile));
    window.setCrewProfile = (p) => { if (p && typeof p === 'object') applyProfile(mergeProfile(state.profile, p)); };
    window.ingestTelemetryPayload = (data, timestamp) => ingest(data, timestamp ? { t: new Date(timestamp).getTime() } : {});
    window.ingestBackendSnapshot = ingestBackendSnapshot;
    window.exportBackendSnapshot = exportBackendSnapshot;
    window.exportMarsSnapshot = exportMarsSnapshot;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
