/* =============================================================================
   A.R.T.E.M.I.S. — 3D anatomy viewer (Three.js r147 + GLTFLoader, no build step)
   -----------------------------------------------------------------------------
   Model: BodyParts3D, © The Database Center for Life Science, CC BY 4.0
   (adult male reference anatomy), trimmed by tools/build-body.mjs into one
   quantized GLB with these nodes:
     skin · muscles · bones · brain · eyes · heart · lungs · stomach · liver ·
     intestines · kidneys · bladder
   The GLB is embedded as base64 in models/body.glb.js so the page also works
   when opened straight from disk (file://).
   ========================================================================== */
(function () {
    'use strict';

    const ORGAN_REGION = {
        eyes: 'NEURO/OCULAR', brain: 'MENTAL/SLEEP', heart: 'CARDIO/AIR', lungs: 'CARDIO/AIR',
        stomach: 'DIET/SUSTENANCE', liver: 'DIET/SUSTENANCE', intestines: 'DIET/SUSTENANCE',
        kidneys: 'BONE/HYDRATION', bladder: 'GYN/CYCLE'
    };
    const LOOK = {
        skin:       { color: '#e5bfa6', roughness: 0.72 },
        muscles:    { color: '#a8352d', roughness: 0.5, clearcoat: 0.3 },
        bones:      { color: '#eee3cc', roughness: 0.62 },
        brain:      { color: '#e9a0a6', roughness: 0.55 },
        eyes:       { color: '#f3efe8', roughness: 0.25 },
        heart:      { color: '#a8232c', roughness: 0.4 },
        lungs:      { color: '#ec9fa4', roughness: 0.6 },
        stomach:    { color: '#e59c78', roughness: 0.5 },
        liver:      { color: '#8f3529', roughness: 0.45 },
        intestines: { color: '#eab39a', roughness: 0.55 },
        kidneys:    { color: '#8d332f', roughness: 0.45 },
        bladder:    { color: '#e9c27d', roughness: 0.5 }
    };
    const LAYERS = { skin: ['skin'], muscles: ['muscles'], skeleton: ['bones'], organs: Object.keys(ORGAN_REGION) };
    const FOCUS_ZOOM = { 'NEURO/OCULAR': 0.36, 'MENTAL/SLEEP': 0.36, 'CARDIO/AIR': 0.5, 'DIET/SUSTENANCE': 0.5, 'BONE/HYDRATION': 0.75, 'GYN/CYCLE': 0.5 };

    function b64ToBuffer(b64) {
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out.buffer;
    }

    function createBodyViewer(opts) {
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return null;
        const { canvas, stage, hotspotLayer, regions, colors, onSelect, onLoad } = opts;
        let renderer;
        try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return null; }
        if (!renderer.getContext()) return null;

        THREE.ColorManagement.legacyMode = false;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setClearColor(0x000000, 0);

        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 50);
        if (THREE.RoomEnvironment) {
            const pmrem = new THREE.PMREMGenerator(renderer);
            scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
        }
        scene.add(new THREE.HemisphereLight(0xffffff, 0xd9e2ec, 0.55));
        const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(1.2, 2.4, 2.2); scene.add(key);

        /* pedestal + soft contact shadow */
        const shadowTex = (() => {
            const c = document.createElement('canvas'); c.width = c.height = 128;
            const g = c.getContext('2d'); const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
            grd.addColorStop(0, 'rgba(30,45,70,0.35)'); grd.addColorStop(1, 'rgba(30,45,70,0)');
            g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
            return new THREE.CanvasTexture(c);
        })();
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002; scene.add(shadow);
        const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.ring), transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        [0.34, 0.42].forEach((r, i) => {
            const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + (i ? 0.004 : 0.006), 96), ringMat);
            ring.rotation.x = -Math.PI / 2; ring.position.y = 0.001; scene.add(ring);
        });

        const body = new THREE.Group();
        scene.add(body);
        const parts = {};           // name -> mesh
        const layers = { skin: false, muscles: true, skeleton: true, organs: false };
        let autoOrgans = false;
        let active = null, statuses = {}, labels = {};
        let loaded = false;

        /* ---------------------------------------------------------- hotspots */
        const hotspots = {};
        regions.forEach(r => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hotspot';
            btn.dataset.region = r.id;
            btn.hidden = true;
            btn.innerHTML = `<span class="hotspot-dot"></span><span class="hotspot-card"><b>${r.label}</b><span class="hotspot-status"></span></span>`;
            btn.addEventListener('click', () => onSelect && onSelect(r.id));
            hotspotLayer.appendChild(btn);
            hotspots[r.id] = { el: btn, label: r.label, enabled: true, pos: null, normal: new THREE.Vector3(0, 0, 1) };
        });

        /* ------------------------------------------------------------ camera */
        const DEFAULT = { yaw: 0.35, pitch: 0.05, zoom: 1, ty: 0.86 };
        const cam = { ...DEFAULT }, goal = { ...DEFAULT };
        let fitDist = 3.6, width = 1, height = 1, needsRender = true, visible = true;
        const target = new THREE.Vector3();

        function resize() {
            const rect = stage.getBoundingClientRect();
            width = Math.max(1, rect.width); height = Math.max(1, rect.height);
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
            fitDist = Math.max(1.9 / 2 / t, 0.75 / 2 / (t * camera.aspect));
            needsRender = true;
        }

        let dragging = false, lastX = 0, lastY = 0, ptype = 'mouse';
        canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; ptype = e.pointerType; canvas.setPointerCapture(e.pointerId); stage.classList.add('is-dragging'); });
        canvas.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            goal.yaw -= (e.clientX - lastX) * 0.01;
            if (ptype === 'mouse') goal.pitch = THREE.MathUtils.clamp(goal.pitch + (e.clientY - lastY) * 0.005, -0.35, 0.6);
            lastX = e.clientX; lastY = e.clientY; needsRender = true;
        });
        const endDrag = () => { dragging = false; stage.classList.remove('is-dragging'); };
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);
        canvas.addEventListener('keydown', (e) => {
            const map = { ArrowLeft: () => { goal.yaw += 0.25; }, ArrowRight: () => { goal.yaw -= 0.25; },
                ArrowUp: () => { goal.pitch = Math.min(0.6, goal.pitch + 0.1); }, ArrowDown: () => { goal.pitch = Math.max(-0.35, goal.pitch - 0.1); },
                '+': () => api.zoom(1), '=': () => api.zoom(1), '-': () => api.zoom(-1) };
            if (map[e.key]) { map[e.key](); e.preventDefault(); needsRender = true; }
        });

        /* ------------------------------------------------------------ looks */
        const statusColor = (s) => ({ YELLOW: colors.warn, RED: colors.crit }[s]);
        function applyLook() {
            if (!loaded) return;
            const xray = layers.organs;
            Object.entries(parts).forEach(([name, mesh]) => {
                const mat = mesh.material;
                const layer = Object.keys(LAYERS).find(l => LAYERS[l].includes(name));
                let on = layers[layer];
                const region = ORGAN_REGION[name];
                if (region && hotspots[region] && !hotspots[region].enabled) on = false;
                mesh.visible = on;
                let opacity = 1;
                if (name === 'skin') opacity = (layers.muscles || layers.skeleton || layers.organs) ? 0.16 : 1;
                if (name === 'muscles') opacity = xray ? 0.2 : 1;
                if (name === 'bones' && xray && active && active !== 'BONE/HYDRATION') opacity = 0.35;
                if (region && active && active !== region) opacity = 0.3;
                mat.opacity = opacity;
                if (mat.transparent !== opacity < 1) { mat.transparent = opacity < 1; mat.needsUpdate = true; }
                mat.depthWrite = opacity >= 1;
                mesh.renderOrder = opacity < 1 ? 2 : 0;
                const s = region ? statuses[region] : (name === 'bones' ? statuses['BONE/HYDRATION'] : null);
                const sc = statusColor(s);
                mat.userData.pulse = sc && !(name === 'bones' && !xray) ? 1 : 0;
                mat.emissive.set(sc || (region && active === region ? colors.accentGlow : '#000000'));
                mat.emissiveIntensity = sc ? 0.45 : (region && active === region ? 0.35 : 0);
            });
            needsRender = true;
        }

        function applyHotspots() {
            Object.entries(hotspots).forEach(([id, hs]) => {
                const s = statuses[id] || 'idle';
                hs.el.dataset.status = s;
                hs.el.hidden = !hs.enabled || !hs.pos;
                hs.el.classList.toggle('is-active', active === id);
                hs.el.classList.toggle('has-card', s === 'RED' || s === 'YELLOW' || active === id);
                const text = labels[id] || { GREEN: 'Normal', YELLOW: 'Drift', RED: 'Critical', idle: 'No data yet', inactive: 'Not tracked here' }[s];
                hs.el.querySelector('.hotspot-status').textContent = text;
                hs.el.setAttribute('aria-label', `${hs.label}: ${text}`);
            });
            needsRender = true;
        }

        /* ----------------------------------------------------------- loading */
        function frontPoint(x, y, meshes, fallbackZ) {
            const rc = new THREE.Raycaster(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1));
            const hit = rc.intersectObjects(meshes.filter(Boolean), false)[0];
            return new THREE.Vector3(x, y, hit ? hit.point.z + 0.004 : fallbackZ);
        }
        function computeAnchors() {
            const box = (n) => parts[n] ? new THREE.Box3().setFromObject(parts[n]) : null;
            const surface = [parts.muscles, parts.skin];
            const c = (b) => b.getCenter(new THREE.Vector3());
            const set = (id, p, normal) => { if (hotspots[id] && p) { hotspots[id].pos = p; if (normal) hotspots[id].normal.copy(normal).normalize(); } };
            const eyes = box('eyes'), brain = box('brain'), heart = box('heart'), stomach = box('stomach'), bladder = box('bladder');
            const skin = box('skin') || box('muscles');
            const H = skin ? skin.max.y : 1.72;
            if (eyes) { const ec = c(eyes); set('NEURO/OCULAR', frontPoint(ec.x + (eyes.max.x - eyes.min.x) / 4, ec.y, surface, eyes.max.z)); }
            if (brain) { const bc = c(brain); set('MENTAL/SLEEP', new THREE.Vector3(bc.x, brain.max.y + 0.012, bc.z + 0.01), new THREE.Vector3(0, 1, 0.3)); }
            if (heart) { const hc = c(heart); set('CARDIO/AIR', frontPoint(hc.x, hc.y, surface, heart.max.z)); }
            if (stomach) { const sc = c(stomach); set('DIET/SUSTENANCE', frontPoint(sc.x, sc.y, surface, stomach.max.z)); }
            set('BONE/HYDRATION', frontPoint(skin ? (skin.min.x + skin.max.x) / 2 - 0.09 : -0.09, H * 0.285, surface, 0.06));
            if (bladder) { const bl = c(bladder); set('GYN/CYCLE', frontPoint(bl.x, bl.y, surface, bladder.max.z)); }
            DEFAULT.ty = goal.ty = cam.ty = H / 2;
        }

        function load(buffer) {
            new THREE.GLTFLoader().parse(buffer, '', (gltf) => {
                gltf.scene.traverse((o) => {
                    if (!o.isMesh) return;
                    const name = (o.name || (o.parent && o.parent.name) || '').toLowerCase();
                    const look = LOOK[name] || { color: '#cccccc', roughness: 0.6 };
                    o.geometry.computeVertexNormals();
                    o.material = new THREE.MeshPhysicalMaterial({ color: look.color, roughness: look.roughness, metalness: 0, clearcoat: look.clearcoat || 0, clearcoatRoughness: 0.5, envMapIntensity: 0.9 });
                    parts[name] = o;
                });
                body.add(gltf.scene);
                gltf.scene.updateMatrixWorld(true);
                computeAnchors();
                loaded = true;
                applyLook(); applyHotspots();
                stage.classList.add('is-loaded');
                onLoad && onLoad(true);
            }, (err) => { console.error('Anatomy model failed to load', err); onLoad && onLoad(false); });
        }

        /* --------------------------------------------------------------- loop */
        const tmp = new THREE.Vector3(), toCam = new THREE.Vector3();
        function placeHotspots() {
            Object.values(hotspots).forEach(hs => {
                if (!hs.enabled || !hs.pos) return;
                tmp.copy(hs.pos);
                toCam.copy(camera.position).sub(tmp).normalize();
                const facing = hs.normal.dot(toCam);
                tmp.project(camera);
                const x = (tmp.x + 1) / 2 * width, y = (1 - tmp.y) / 2 * height;
                const inView = tmp.z < 1 && x > -10 && x < width + 10 && y > -10 && y < height + 10;
                const op = !inView ? 0 : (facing > 0.05 ? 1 : (facing > -0.4 ? 0.45 : 0.22));
                hs.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
                hs.el.style.opacity = op;
                hs.el.classList.toggle('card-left', x > width * 0.55);
                hs.el.classList.toggle('is-behind', facing <= 0.05);
            });
        }

        const t0 = performance.now();
        function frame(now) {
            requestAnimationFrame(frame);
            if (!visible) return;
            let moving = false;
            ['yaw', 'pitch', 'zoom', 'ty'].forEach(p => {
                const d = goal[p] - cam[p];
                if (Math.abs(d) > 0.0005) { cam[p] += d * 0.14; moving = true; } else cam[p] = goal[p];
            });
            const pulsing = loaded && !reduceMotion && Object.values(parts).some(m => m.visible && m.material.userData.pulse);
            if (!moving && !needsRender && !pulsing) return;
            needsRender = false;
            if (pulsing) {
                const k = 0.25 + 0.4 * (Math.sin((now - t0) / 1000 * 3.2) * 0.5 + 0.5);
                Object.values(parts).forEach(m => { if (m.material.userData.pulse) m.material.emissiveIntensity = k; });
            }
            const dist = fitDist * cam.zoom;
            target.set(0, cam.ty, 0);
            camera.position.set(dist * Math.sin(cam.yaw) * Math.cos(cam.pitch), cam.ty + dist * Math.sin(cam.pitch), dist * Math.cos(cam.yaw) * Math.cos(cam.pitch));
            camera.lookAt(target);
            renderer.render(scene, camera);
            placeHotspots();
        }

        const ro = new ResizeObserver(resize); ro.observe(stage);
        const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; needsRender = true; }); io.observe(stage);
        resize();
        requestAnimationFrame(frame);

        const api = {
            load(b64) {
                if (!b64) { onLoad && onLoad(false); return; }
                setTimeout(() => { try { load(b64ToBuffer(b64)); } catch (e) { console.error(e); onLoad && onLoad(false); } }, 30);
            },
            setStatuses(map, text = {}) { statuses = { ...map }; labels = { ...text }; applyLook(); applyHotspots(); },
            setActive(id) {
                active = id || null;
                if (active && !layers.organs) { layers.organs = true; autoOrgans = true; }
                if (!active && autoOrgans) { layers.organs = false; autoOrgans = false; }
                applyLook(); applyHotspots();
                return { ...layers };
            },
            setRegionEnabled(id, on) { if (hotspots[id]) { hotspots[id].enabled = on; applyLook(); applyHotspots(); } },
            setLayer(name, on) { if (name in layers) { layers[name] = on; if (name === 'organs') autoOrgans = false; applyLook(); } return { ...layers }; },
            getLayers: () => ({ ...layers }),
            focus(id) {
                const hs = hotspots[id];
                if (!hs || !hs.pos) return;
                goal.ty = hs.pos.y; goal.zoom = FOCUS_ZOOM[id] || 0.5; goal.yaw = 0.3; goal.pitch = 0.04; needsRender = true;
            },
            preset(name) {
                const yaw = { front: 0, side: Math.PI / 2, back: Math.PI }[name];
                if (yaw === undefined) return;
                goal.yaw = yaw + Math.round((goal.yaw - yaw) / (Math.PI * 2)) * Math.PI * 2;
                goal.pitch = 0.05; needsRender = true;
            },
            reset() { Object.assign(goal, DEFAULT, { yaw: DEFAULT.yaw + Math.round(goal.yaw / (Math.PI * 2)) * Math.PI * 2 }); needsRender = true; },
            zoom(dir) { goal.zoom = THREE.MathUtils.clamp(goal.zoom * (dir > 0 ? 0.8 : 1.25), 0.3, 1.4); needsRender = true; },
            meshCoordinates() {
                return Object.fromEntries(Object.entries(hotspots).filter(([, h]) => h.pos).map(([id, h]) => [id, { x: +h.pos.x.toFixed(4), y: +h.pos.y.toFixed(4), z: +h.pos.z.toFixed(4) }]));
            }
        };
        return api;
    }

    window.createBodyViewer = createBodyViewer;
})();
