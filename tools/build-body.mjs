// Builds models/body.glb.js from BodyParts3D 4.0 (CC BY 4.0, https://dbarchive.biosciencedbc.jp/en/bodyparts3d/).
// Needs: isa_BP3D_4.0_obj_99.zip unzipped to <dir>/isaobj, plus isa_element_parts.txt and partof_element_parts.txt in <dir>.
// npm i @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer
// Usage: node tools/build-body.mjs <dir> out.glb [--stats]   then base64-embed out.glb into models/body.glb.js
import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { weld, simplifyPrimitive, quantize, dedup, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const [, , DIR, OUT, flag] = process.argv;
const OBJ_DIR = path.join(DIR, 'isaobj', 'isa_BP3D_4.0_obj_99');

const readList = (file) => {
    const map = new Map();
    fs.readFileSync(path.join(DIR, file), 'utf8').split(/\r?\n/).slice(1).forEach(line => {
        const [, name, fj] = line.split('\t');
        if (!name || !fj) return;
        if (!map.has(name)) map.set(name, new Set());
        map.get(name).add(fj.trim());
    });
    return map;
};
const isa = readList('isa_element_parts.txt');
const partof = readList('partof_element_parts.txt');
const pick = (map, names) => new Set(names.flatMap(n => [...(map.get(n) || [])]));

// Priority order: first group to claim an element keeps it.
const GROUPS = [
    { name: 'eyes',       ids: pick(partof, ['right eyeball', 'left eyeball']), ratio: 0.06 },
    { name: 'brain',      ids: pick(partof, ['brain']), ratio: 0.08 },
    { name: 'heart',      ids: pick(partof, ['heart']), ratio: 0.3 },
    { name: 'lungs',      ids: pick(partof, ['upper lobe of right lung', 'middle lobe of lung', 'lower lobe of right lung', 'upper lobe of left lung', 'lower lobe of left lung']), ratio: 0.3 },
    { name: 'stomach',    ids: pick(partof, ['stomach']), ratio: 1 },
    { name: 'liver',      ids: pick(partof, ['right lobe of liver', 'left lobe of liver', 'caudate lobe of liver', 'quadrate lobe of liver']), ratio: 0.5 },
    { name: 'intestines', ids: pick(partof, ['small intestine', 'large intestine']), ratio: 0.45 },
    { name: 'kidneys',    ids: pick(partof, ['right kidney', 'left kidney']), ratio: 1 },
    { name: 'bladder',    ids: pick(partof, ['urinary bladder']), ratio: 1 },
    { name: 'bones',      ids: pick(isa, ['bone organ']), ratio: 0.12 },
    { name: 'muscles',    ids: pick(isa, ['muscle organ']), ratio: 0.05 },
    { name: 'skin',       ids: pick(partof, ['skin']), ratio: 0.25 }
];

const claimed = new Set();
GROUPS.forEach(g => { g.ids = new Set([...g.ids].filter(id => !claimed.has(id) && fs.existsSync(path.join(OBJ_DIR, `${id}.obj`)))); g.ids.forEach(id => claimed.add(id)); });

// BodyParts3D: millimetres, Z up, front = -Y.  three.js: metres, Y up, front = +Z.
function loadGroup(ids) {
    const pos = [], idx = [];
    for (const id of ids) {
        const base = pos.length / 3;
        const txt = fs.readFileSync(path.join(OBJ_DIR, `${id}.obj`), 'utf8');
        for (const line of txt.split('\n')) {
            if (line.startsWith('v ')) {
                const [, x, y, z] = line.trim().split(/\s+/).map(Number);
                pos.push(x / 1000, z / 1000, -y / 1000);
            } else if (line.startsWith('f ')) {
                const f = line.trim().split(/\s+/).slice(1).map(t => parseInt(t.split('/')[0], 10) - 1 + base);
                for (let i = 1; i + 1 < f.length; i++) idx.push(f[0], f[i], f[i + 1]);
            }
        }
    }
    return { pos: new Float32Array(pos), idx: new Uint32Array(idx) };
}

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('body');
let minY = Infinity, maxY = -Infinity, cx = 0, cz = 0, n = 0;
const raw = GROUPS.map(g => ({ g, ...loadGroup(g.ids) }));
raw.forEach(({ g, pos, idx }) => {
    console.log(`${g.name.padEnd(11)} parts ${String(g.ids.size).padStart(4)}  tris ${String(idx.length / 3).padStart(8)}`);
    if (g.name === 'skin' || g.name === 'bones') for (let i = 0; i < pos.length; i += 3) {
        minY = Math.min(minY, pos[i + 1]); maxY = Math.max(maxY, pos[i + 1]); cx += pos[i]; cz += pos[i + 2]; n++;
    }
});
cx /= n; cz /= n;
console.log(`height ${(maxY - minY).toFixed(3)} m, floor ${minY.toFixed(3)}, centre x ${cx.toFixed(3)} z ${cz.toFixed(3)}`);
if (flag === '--stats') process.exit(0);

raw.forEach(({ g, pos, idx }) => {
    if (!idx.length) return;
    for (let i = 0; i < pos.length; i += 3) { pos[i] -= cx; pos[i + 1] -= minY; pos[i + 2] -= cz; }
    const prim = doc.createPrimitive()
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(pos).setBuffer(buffer))
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(idx).setBuffer(buffer))
        .setMaterial(doc.createMaterial(g.name));
    const mesh = doc.createMesh(g.name).addPrimitive(prim);
    mesh.setExtras({ ratio: g.ratio });
    scene.addChild(doc.createNode(g.name).setMesh(mesh));
});

await MeshoptSimplifier.ready;
await doc.transform(weld());
for (const mesh of doc.getRoot().listMeshes()) {
    const ratio = mesh.getExtras().ratio;
    if (ratio < 1) for (const prim of mesh.listPrimitives()) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio, error: 0.002, lockBorder: false });
}
await doc.transform(dedup(), prune(), quantize({ quantizePosition: 14 }));
doc.getRoot().listMeshes().forEach(m => m.setExtras({}));
doc.getRoot().setExtras({ credit: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International' });
doc.getRoot().listNodes().forEach(nd => {
    const p = nd.getMesh().listPrimitives()[0];
    console.log(`  out ${nd.getName().padEnd(11)} tris ${String(p.getIndices().getCount() / 3).padStart(7)}`);
});
await new NodeIO().registerExtensions([KHRMeshQuantization]).write(OUT, doc);
console.log('wrote', OUT, (fs.statSync(OUT).size / 1048576).toFixed(2), 'MB');
