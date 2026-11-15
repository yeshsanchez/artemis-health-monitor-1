/* =============================================================================
   A.R.T.E.M.I.S. — 3D body map (Three.js r147, no build step)
   -----------------------------------------------------------------------------
   A stylized "hologram" crew member built from simple shapes, so there is no
   model file to download or license. Three views:
     organs   — see-through body with the organs each region tracks
     surface  — solid body, status shown by the hotspots
     skeleton — bones (Bones & kidneys region)
   Hotspots are real HTML buttons laid over the canvas (keyboard + screen-reader
   friendly). Drag to rotate; preset angles; zoom buttons.
   Hotspot positions double as the Mars spec's body_map_nodes.mesh_coordinates.
   ========================================================================== */
(function () {
    'use strict';

    const ANCHORS = {
        'NEURO/OCULAR':    { pos: [0.037, 1.622, 0.108], normal: [0.25, 0, 1],  focus: { y: 1.58, dist: 0.42, yaw: 0.35 } },
        'MENTAL/SLEEP':    { pos: [0, 1.738, 0.01],      normal: [0, 1, 0.3],   focus: { y: 1.58, dist: 0.42, yaw: 0.35 } },
        'CARDIO/AIR':      { pos: [0.04, 1.31, 0.103],   normal: [0, 0, 1],     focus: { y: 1.24, dist: 0.58, yaw: 0.35 } },
        'DIET/SUSTENANCE': { pos: [0.04, 1.17, 0.09],    normal: [0, 0, 1],     focus: { y: 1.16, dist: 0.58, yaw: 0.35 } },
        'BONE/HYDRATION':  { pos: [0.098, 0.5, 0.062],   normal: [0, 0, 1],     focus: { y: 0.8, dist: 0.8, yaw: 0.6 } },
        'GYN/CYCLE':       { pos: [0, 0.985, 0.097],     normal: [0, 0, 1],     focus: { y: 1.02, dist: 0.58, yaw: 0.35 } }
    };

    const VERT = `
        varying vec3 vN; varying vec3 vV;
        void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
        }`;
    const FRAG = `
        uniform vec3 uColor; uniform float uOpacity; uniform float uPower; uniform float uBase;
        varying vec3 vN; varying vec3 vV;
        void main() {
            float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
            gl_FragColor = vec4(uColor * (0.45 + f), (uBase + f) * uOpacity);
        }`;

    function createBodyViewer(opts) {
        if (typeof THREE === 'undefined') return null;
        const { canvas, stage, hotspotLayer, regions, colors, onSelect } = opts;
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
        } catch (e) { return null; }
        if (!renderer.getContext()) return null;

        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
        scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x0b1424, 0.9));
        const key = new THREE.DirectionalLight(0xffffff, 0.75); key.position.set(1.5, 2.5, 2.5); scene.add(key);
        const rim = new THREE.DirectionalLight(new THREE.Color(colors.accent), 0.6); rim.position.set(-2, 1.5, -2); scene.add(rim);

        const body = new THREE.Group();
        scene.add(body);

        /* ---------------------------------------------------------- materials */
        const holoMat = new THREE.ShaderMaterial({
            uniforms: { uColor: { value: new THREE.Color(colors.accent) }, uOpacity: { value: 0.85 }, uPower: { value: 2.0 }, uBase: { value: 0.05 } },
            vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        const solidMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colors.bodySolid), roughness: 0.62, metalness: 0.08 });
        const boneMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colors.bone), roughness: 0.55, emissive: new THREE.Color(colors.bone), emissiveIntensity: 0.12 });

        const shell = [];
        const addShell = (geo, parent, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) => {
            const mesh = new THREE.Mesh(geo, holoMat);
            mesh.position.set(...p); mesh.scale.set(...s); mesh.rotation.set(...r);
            mesh.renderOrder = 2;
            parent.add(mesh); shell.push(mesh);
            return mesh;
        };
        const skeleton = new THREE.Group(); skeleton.visible = false;
        const addBone = (geo, parent, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) => {
            const mesh = new THREE.Mesh(geo, boneMat);
            mesh.position.set(...p); mesh.scale.set(...s); mesh.rotation.set(...r);
            parent.add(mesh); return mesh;
        };
        const limbBones = [];

        /* -------------------------------------------------------------- body */
        const torsoProfile = [[0, 0.9], [0.1, 0.905], [0.155, 0.94], [0.172, 1.0], [0.165, 1.06], [0.145, 1.12], [0.135, 1.17], [0.142, 1.23],
            [0.16, 1.3], [0.18, 1.36], [0.195, 1.405], [0.17, 1.445], [0.11, 1.47], [0.05, 1.478], [0, 1.48]]
            .map(([r, y]) => new THREE.Vector2(r, y));
        const torsoGeo = new THREE.LatheGeometry(torsoProfile, 48);
        torsoGeo.scale(1, 1, 0.62);
        addShell(torsoGeo, body);
        addShell(new THREE.CylinderGeometry(0.048, 0.056, 0.1, 24), body, [0, 1.48, 0]);
        addShell(new THREE.SphereGeometry(0.11, 40, 32), body, [0, 1.615, 0.004], [0.88, 1.1, 0.98]);

        function limb(side, joint, rotZ, parts) {
            const g = new THREE.Group();
            g.position.set(side * joint[0], joint[1], joint[2] || 0);
            g.rotation.z = side * rotZ;
            body.add(g);
            parts(g);
            return g;
        }
        [-1, 1].forEach(side => {
            limb(side, [0.205, 1.4], 0.12, (g) => {
                addShell(new THREE.CapsuleGeometry(0.045, 0.22, 8, 18), g, [0, -0.155, 0]);
                limbBones.push(addBone(new THREE.CylinderGeometry(0.014, 0.016, 0.27, 10), g, [0, -0.15, 0]));
                const fore = new THREE.Group(); fore.position.set(0, -0.29, 0); fore.rotation.x = -0.15; g.add(fore);
                addShell(new THREE.CapsuleGeometry(0.038, 0.21, 8, 18), fore, [0, -0.145, 0]);
                limbBones.push(addBone(new THREE.CylinderGeometry(0.012, 0.013, 0.25, 10), fore, [0, -0.145, 0]));
                addShell(new THREE.SphereGeometry(0.045, 20, 16), fore, [0, -0.335, 0], [0.7, 1.25, 0.45]);
            });
            limb(side, [0.088, 0.93], 0.025, (g) => {
                addShell(new THREE.CapsuleGeometry(0.068, 0.3, 8, 20), g, [0, -0.22, 0]);
                limbBones.push(addBone(new THREE.CylinderGeometry(0.018, 0.021, 0.4, 10), g, [0, -0.215, 0]));
                const shin = new THREE.Group(); shin.position.set(0, -0.43, 0); g.add(shin);
                addShell(new THREE.CapsuleGeometry(0.05, 0.31, 8, 18), shin, [0, -0.21, 0]);
                limbBones.push(addBone(new THREE.CylinderGeometry(0.015, 0.018, 0.38, 10), shin, [0, -0.21, 0]));
                addShell(new THREE.CapsuleGeometry(0.035, 0.12, 6, 14), shin, [0, -0.43, 0.045], [1, 1, 1], [Math.PI / 2, 0, 0]);
            });
        });
        limbBones.forEach(b => { b.visible = false; });

        /* ----------------------------------------------------------- skeleton */
        addBone(new THREE.SphereGeometry(0.098, 28, 22), skeleton, [0, 1.62, 0.004], [0.88, 1.06, 0.98]);
        for (let i = 0; i < 20; i++) {
            const y = 0.96 + i * 0.026;
            addBone(new THREE.CylinderGeometry(0.016, 0.016, 0.018, 10), skeleton, [0, y, -0.058 + 0.012 * Math.sin(i / 3)]);
        }
        const radiusAt = (y) => {
            for (let i = 1; i < torsoProfile.length; i++) {
                const a = torsoProfile[i - 1], b = torsoProfile[i];
                if (y >= a.y && y <= b.y) return a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y));
            }
            return 0.15;
        };
        const gap = 0.9;
        for (let i = 0; i < 7; i++) {
            const y = 1.2 + i * 0.03;
            const scaleG = new THREE.Group(); scaleG.scale.set(1, 1, 0.62); scaleG.position.y = y; skeleton.add(scaleG);
            const rotG = new THREE.Group(); rotG.rotation.y = -gap / 2 - Math.PI / 2; scaleG.add(rotG);
            const rib = addBone(new THREE.TorusGeometry(radiusAt(y) - 0.022, 0.0065, 6, 40, Math.PI * 2 - gap), rotG);
            rib.rotation.x = Math.PI / 2;
        }
        addBone(new THREE.BoxGeometry(0.022, 0.16, 0.012), skeleton, [0, 1.3, 0.09]);
        const pelvisG = new THREE.Group(); pelvisG.scale.set(1, 1, 0.7); pelvisG.position.y = 0.985; skeleton.add(pelvisG);
        addBone(new THREE.TorusGeometry(0.098, 0.022, 8, 32), pelvisG, [0, 0, 0], [1, 1, 1], [Math.PI / 2 - 0.25, 0, 0]);
        [-1, 1].forEach(s => addBone(new THREE.CapsuleGeometry(0.01, 0.13, 4, 8), skeleton, [s * 0.09, 1.445, 0.03], [1, 1, 1], [0, 0, s * (Math.PI / 2 - 0.15)]));
        body.add(skeleton);

        /* ------------------------------------------------------------- organs */
        const organs = new THREE.Group();
        body.add(organs);
        const organMeshes = [];
        const addOrgan = (region, geo, p, s = [1, 1, 1], r = [0, 0, 0]) => {
            const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colors.idle), emissive: new THREE.Color(colors.idle), emissiveIntensity: 0.35, roughness: 0.45, transparent: true, opacity: 0.92 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(...p); mesh.scale.set(...s); mesh.rotation.set(...r);
            mesh.userData.region = region;
            organs.add(mesh); organMeshes.push(mesh);
            return mesh;
        };
        const sphere = (r, w = 24, h = 18) => new THREE.SphereGeometry(r, w, h);
        addOrgan('MENTAL/SLEEP', sphere(0.085, 32, 24), [0, 1.655, -0.005], [0.88, 0.78, 1.0]);
        [-1, 1].forEach(s => addOrgan('NEURO/OCULAR', sphere(0.019), [s * 0.037, 1.622, 0.083]));
        addOrgan('CARDIO/AIR', sphere(0.05), [0.03, 1.3, 0.035], [0.85, 1.05, 0.8], [0, 0, -0.4]);
        [-1, 1].forEach(s => addOrgan('CARDIO/AIR', sphere(0.072), [s * 0.082, 1.315, 0], [0.85, 1.55, 0.85]));
        addOrgan('DIET/SUSTENANCE', sphere(0.05), [0.035, 1.175, 0.03], [1.3, 0.85, 0.8], [0, 0, 0.3]);
        [-1, 1].forEach(s => addOrgan('BONE/HYDRATION', sphere(0.032), [s * 0.068, 1.12, -0.045], [0.75, 1.3, 0.7]));
        addOrgan('GYN/CYCLE', sphere(0.034), [0, 0.985, 0.025], [1.15, 0.9, 0.8]);

        /* -------------------------------------------------------- floor & scan */
        const accent = new THREE.Color(colors.accent);
        const floorRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.312, 72), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
        floorRing.rotation.x = -Math.PI / 2; floorRing.position.y = 0.03; scene.add(floorRing);
        const floorDisc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 72), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.07, side: THREE.DoubleSide }));
        floorDisc.rotation.x = -Math.PI / 2; floorDisc.position.y = 0.029; scene.add(floorDisc);
        const scan = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.23, 64), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        scan.rotation.x = -Math.PI / 2; scan.scale.set(1, 0.62, 1); scene.add(scan);
        scan.visible = !reduceMotion;

        /* ----------------------------------------------------------- hotspots */
        const hotspots = {};
        regions.forEach(r => {
            const a = ANCHORS[r.id];
            if (!a) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hotspot';
            btn.dataset.region = r.id;
            btn.innerHTML = `<span class="hotspot-dot"></span><span class="hotspot-label">${r.label}</span>`;
            btn.addEventListener('click', () => onSelect && onSelect(r.id));
            hotspotLayer.appendChild(btn);
            hotspots[r.id] = {
                el: btn, label: r.label, enabled: true,
                pos: new THREE.Vector3(...a.pos), normal: new THREE.Vector3(...a.normal).normalize()
            };
        });

        /* ------------------------------------------------------------- camera */
        const cam = { yaw: 0.45, pitch: 0.06, zoom: 1, ty: 0.9 };
        const goal = { ...cam };
        const DEFAULT = { yaw: 0.45, pitch: 0.06, zoom: 1, ty: 0.9 };
        let fitDist = 3.6, width = 1, height = 1;
        const target = new THREE.Vector3();

        function resize() {
            const rect = stage.getBoundingClientRect();
            width = Math.max(1, rect.width); height = Math.max(1, rect.height);
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
            fitDist = Math.max(1.95 / 2 / t, 0.8 / 2 / (t * camera.aspect));
            needsRender = true;
        }

        /* ----------------------------------------------------------- controls */
        let dragging = false, lastX = 0, lastY = 0, pointerType = 'mouse';
        canvas.addEventListener('pointerdown', (e) => {
            dragging = true; lastX = e.clientX; lastY = e.clientY; pointerType = e.pointerType;
            canvas.setPointerCapture(e.pointerId);
            stage.classList.add('is-dragging');
        });
        canvas.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - lastX, dy = e.clientY - lastY;
            lastX = e.clientX; lastY = e.clientY;
            goal.yaw -= dx * 0.01;
            if (pointerType === 'mouse') goal.pitch = THREE.MathUtils.clamp(goal.pitch + dy * 0.005, -0.35, 0.6);
            needsRender = true;
        });
        const endDrag = () => { dragging = false; stage.classList.remove('is-dragging'); };
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);
        canvas.addEventListener('keydown', (e) => {
            const step = 0.25;
            if (e.key === 'ArrowLeft') goal.yaw += step;
            else if (e.key === 'ArrowRight') goal.yaw -= step;
            else if (e.key === 'ArrowUp') goal.pitch = Math.min(0.6, goal.pitch + 0.1);
            else if (e.key === 'ArrowDown') goal.pitch = Math.max(-0.35, goal.pitch - 0.1);
            else if (e.key === '+' || e.key === '=') api.zoom(1);
            else if (e.key === '-') api.zoom(-1);
            else return;
            e.preventDefault(); needsRender = true;
        });

        /* ------------------------------------------------------------ state */
        let view = 'organs', active = null, statuses = {};
        const statusColor = (s) => colors[{ GREEN: 'ok', YELLOW: 'warn', RED: 'crit', idle: 'idle', inactive: 'inactive' }[s] || 'idle'];

        function applyView() {
            const holo = view !== 'surface';
            shell.forEach(m => { m.material = holo ? holoMat : solidMat; });
            holoMat.uniforms.uOpacity.value = view === 'skeleton' ? 0.32 : 0.85;
            organs.visible = view === 'organs';
            skeleton.visible = view === 'skeleton';
            limbBones.forEach(b => { b.visible = view === 'skeleton'; });
            scan.visible = !reduceMotion && view === 'organs';
            needsRender = true;
        }

        function applyStatuses() {
            organMeshes.forEach(mesh => {
                const r = mesh.userData.region;
                const hs = hotspots[r];
                const enabled = !hs || hs.enabled;
                mesh.visible = enabled;
                const c = new THREE.Color(statusColor(statuses[r] || 'idle'));
                mesh.material.color.copy(c);
                mesh.material.emissive.copy(c);
                const dim = active && active !== r;
                mesh.material.opacity = dim ? 0.22 : 0.92;
                mesh.material.emissiveIntensity = active === r ? 0.75 : 0.35;
            });
            const boneStatus = statuses['BONE/HYDRATION'];
            const boneColor = new THREE.Color(colors.bone);
            if (boneStatus === 'YELLOW' || boneStatus === 'RED') boneColor.lerp(new THREE.Color(statusColor(boneStatus)), 0.45);
            boneMat.color.copy(boneColor); boneMat.emissive.copy(boneColor);
            Object.entries(hotspots).forEach(([id, hs]) => {
                const s = statuses[id] || 'idle';
                hs.el.dataset.status = s;
                hs.el.hidden = !hs.enabled;
                hs.el.classList.toggle('is-active', active === id);
                const text = { GREEN: 'Normal', YELLOW: 'Drift', RED: 'Critical', idle: 'No data yet', inactive: 'Not tracked here' }[s] || '';
                hs.el.setAttribute('aria-label', `${hs.label}: ${text}`);
                hs.el.title = `${hs.label} — ${text}`;
            });
            needsRender = true;
        }

        /* -------------------------------------------------------------- loop */
        let needsRender = true, visible = true, raf = 0, t0 = performance.now();
        const tmp = new THREE.Vector3(), toCam = new THREE.Vector3();

        function placeHotspots() {
            Object.values(hotspots).forEach(hs => {
                if (!hs.enabled) return;
                tmp.copy(hs.pos);
                body.localToWorld(tmp);
                toCam.copy(camera.position).sub(tmp).normalize();
                const facing = hs.normal.dot(toCam);
                tmp.project(camera);
                const x = (tmp.x + 1) / 2 * width, y = (1 - tmp.y) / 2 * height;
                const inView = tmp.z < 1 && x > -20 && x < width + 20 && y > -20 && y < height + 20;
                const op = !inView ? 0 : (facing > 0.05 ? 1 : (facing > -0.35 ? 0.35 + facing : 0.18));
                hs.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
                hs.el.style.opacity = op.toFixed(2);
                hs.el.classList.toggle('is-behind', facing <= 0.05);
            });
        }

        function frame(now) {
            raf = requestAnimationFrame(frame);
            if (!visible) return;
            const k = 0.14;
            let moving = false;
            ['yaw', 'pitch', 'zoom', 'ty'].forEach(p => {
                const d = goal[p] - cam[p];
                if (Math.abs(d) > 0.0005) { cam[p] += d * k; moving = true; } else cam[p] = goal[p];
            });
            const animated = !reduceMotion && (view === 'organs' || Object.values(statuses).includes('RED'));
            if (!moving && !needsRender && !animated) return;
            needsRender = false;

            const t = (now - t0) / 1000;
            if (!reduceMotion) {
                scan.position.y = 0.06 + (Math.sin(t * 0.6) * 0.5 + 0.5) * 1.68;
                organMeshes.forEach(mesh => {
                    if (statuses[mesh.userData.region] === 'RED') mesh.material.emissiveIntensity = 0.45 + 0.4 * (Math.sin(t * 4) * 0.5 + 0.5);
                });
            }
            const dist = fitDist * cam.zoom;
            target.set(0, cam.ty, 0);
            camera.position.set(
                target.x + dist * Math.sin(cam.yaw) * Math.cos(cam.pitch),
                target.y + dist * Math.sin(cam.pitch),
                target.z + dist * Math.cos(cam.yaw) * Math.cos(cam.pitch)
            );
            camera.lookAt(target);
            renderer.render(scene, camera);
            placeHotspots();
        }

        const ro = new ResizeObserver(resize);
        ro.observe(stage);
        const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; needsRender = true; });
        io.observe(stage);
        resize();
        applyView();
        applyStatuses();
        raf = requestAnimationFrame(frame);

        const api = {
            setStatuses(map) { statuses = { ...map }; applyStatuses(); },
            setActive(regionId) { active = regionId || null; applyStatuses(); },
            setRegionEnabled(regionId, on) { if (hotspots[regionId]) { hotspots[regionId].enabled = on; applyStatuses(); } },
            setView(mode) { view = mode; applyView(); },
            focus(regionId) {
                const a = ANCHORS[regionId];
                if (!a) return;
                goal.ty = a.focus.y; goal.zoom = a.focus.dist; goal.yaw = a.focus.yaw; goal.pitch = 0.05;
                needsRender = true;
            },
            preset(name) {
                const yaw = { front: 0, side: Math.PI / 2, back: Math.PI }[name];
                if (yaw === undefined) return;
                const turns = Math.round((goal.yaw - yaw) / (Math.PI * 2));
                goal.yaw = yaw + turns * Math.PI * 2;
                goal.pitch = 0.06; needsRender = true;
            },
            reset() { Object.assign(goal, DEFAULT, { yaw: DEFAULT.yaw + Math.round(goal.yaw / (Math.PI * 2)) * Math.PI * 2 }); needsRender = true; },
            zoom(dir) { goal.zoom = THREE.MathUtils.clamp(goal.zoom * (dir > 0 ? 0.8 : 1.25), 0.35, 1.4); needsRender = true; },
            meshCoordinates() {
                return Object.fromEntries(Object.entries(ANCHORS).map(([id, a]) => [id, { x: a.pos[0], y: a.pos[1], z: a.pos[2] }]));
            },
            dispose() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); }
        };
        return api;
    }

    window.createBodyViewer = createBodyViewer;
    window.BODY_ANCHORS = ANCHORS;
})();
