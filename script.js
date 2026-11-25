(() => {
'use strict';
/* ---------- Global settings (edit these) ---------- */
const CFG = { word: 'F O R   Y O U', heart: '<3', duration: 20, captionStart: 16, seed: 1402, spin: 0.45, pitch: 0.24, start: 'lily' };

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d');
const hud = $('hud'), statusEl = $('status'), cap1 = $('cap1'), cap2 = $('cap2'), btnPause = $('pause'), btnReplay = $('replay'), picker = $('picker');
const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const easeOut = p => 1 - Math.pow(1 - p, 3);
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lineChar = ang => { const t = ((ang % Math.PI) + Math.PI) % Math.PI; return (t < Math.PI / 8 || t > 7 * Math.PI / 8) ? '-' : t < 3 * Math.PI / 8 ? '\\' : t < 5 * Math.PI / 8 ? '|' : '/'; };
const PI2 = Math.PI * 2, RAMP = '.:-=+rxtjucnvz*o%&8#BQ@', RAMP_P = "./\\|-_+:;,'`", BUD = [28, 66, 38];

/* ---------- Flower presets: anatomy, arrangement, leaves and theme ---------- */
const GREENS = ['#1f7a3a', '#2f9a4e', '#46b862', '#7de39a'];
const roseLayers = Array.from({ length: 6 }, (_, l) => ({ n: [3, 4, 6, 8, 10, 12][l], len: .46 + .13 * l, wid: l < 2 ? .8 : .7, r0: .04 + .035 * l, ao: [.2, .45, .75, 1, 1.25, 1.5][l], ac: [.05, .08, .12, .15, .18, .22][l], curl: l < 2 ? .15 : .5 + .08 * l, rip: l > 1 ? .3 : .1, cup: l < 3 ? 1 : .3, off: l * .95 }));
const ramp7 = (f) => Array.from({ length: 7 }, (_, l) => f(l));
const VARIANTS = {
  lily: { label: 'Lily', plural: 'lilies', N: 12, R: [10.5, 12], dome: [38, 24, 34, 54, 1.6], up: .3, greens: ['#14633a', '#1f8a4c', '#35ad66', '#7bdc9a'],
    pals: [['#f0c84a', '#fff1f4', '#ff9ec0'], ['#f0c84a', '#fff1f4', '#ff9ec0'], ['#e8b84a', '#ffe6c0', '#ff9f6b'], ['#d8d86a', '#ffffff', '#ffd3e3']],
    flower: { ld: .5, qd: .05, jit: .1, spots: 1, stamens: 6, tcb: .3, halo: 1.2, layers: [{ n: 3, len: 1.5, wid: .3, r0: .06, ao: 1.0, ac: .1, curl: 1.0, rip: .4, cup: .6, tip: 'point', off: 0 }, { n: 3, len: 1.4, wid: .36, r0: .06, ao: .9, ac: .1, curl: 1.0, rip: .45, cup: .8, tip: 'point', off: Math.PI / 3 }] },
    leaves: { n: 36, len: [8, 12], wid: [2, 2.8], strap: 1, droop: .3 }, side: [13, 2.8],
    theme: { base: '#030816', blobs: [[.2, .25, .6, '70,110,230', .17], [.8, .3, .55, '150,90,230', .14], [.5, .95, .65, '60,200,230', .13], [.9, .8, .4, '120,150,255', .1]], stars: ['#ffffff', '#d4e4ff', '#c9b8ff', '#9be7ff', '#fff6d8'], paper: [215, 220, 232], tie: ['#e8e8f2', '#ffffff'], accent: '#9fb8ff', pale: '#e4ecff', heart: '#ff7ab8', glow: '150,170,255', fall: ['#fff4f7', '#ffc2d6', '#ffe4ec', '#d4e4ff'] } }

};

/* ---------- Scene data, rebuilt whenever a bouquet is chosen ---------- */
let V, VK, rnd, roses = [], petalDefs = [], NS = 0, SX, SY, SZ, SP, ST, SD, SR, SG, SB, SC, SK, XM, YM, ZM, PD, X0, Y0, Z0, X1, Y1, Z1, RR, RG, RB, RC;
function build(key) {
  VK = key; V = VARIANTS[key]; rnd = mulberry32(CFG.seed + key.length * 17);
  const th = V.theme, GREEN = V.greens.map(hex), H = V.flower, [AX, AY, AZ, CY, BMAX] = V.dome, N = V.N, lsh = V.lsh ?? .55, TIE = th.tie.map(hex);
  const code = (b, ramp = RAMP) => Math.max(0, Math.min(ramp.length - 1, Math.floor(b * (ramp.length - 1) + (rnd() - .5) * 3)));
  const jit = (c, a) => { const f = 1 + (rnd() - .5) * a; return [c[0] * f, c[1] * f, c[2] * f]; };
  const A = { x: [], y: [], z: [], p: [], t: [], d: [], r: [], g: [], b: [], c: [], k: [] };
  const RP = { xm: [], ym: [], zm: [], d: [], x0: [], y0: [], z0: [], x1: [], y1: [], z1: [], r: [], g: [], b: [], c: [] };
  const addS = (x, y, z, par, t0, dur, rgb, ch, k) => { A.x.push(x); A.y.push(y); A.z.push(z); A.p.push(par); A.t.push(t0); A.d.push(dur); A.r.push(rgb[0]); A.g.push(rgb[1]); A.b.push(rgb[2]); A.c.push(ch); A.k.push(k || 0); };
  const rp = (c, md, o, pd, rgb, ch) => { RP.x0.push(c[0]); RP.y0.push(c[1]); RP.z0.push(c[2]); RP.xm.push(md[0]); RP.ym.push(md[1]); RP.zm.push(md[2]); RP.x1.push(o[0]); RP.y1.push(o[1]); RP.z1.push(o[2]); RP.d.push(pd); RP.r.push(rgb[0]); RP.g.push(rgb[1]); RP.b.push(rgb[2]); RP.c.push(ch); };
  // thick green stalk (grows first, glowing)
  for (let y = 119; y >= 94; y -= 1) for (let k = 0; k < 19; k++) { const a = k / 19 * PI2, br = .3 + .7 * (.5 + .5 * Math.cos(a - .8)); addS(50 + 3.4 * Math.cos(a), y, 3.4 * Math.sin(a), (119 - y) / 25, 1, 2.2, jit(mix(GREEN[0], hex('#8dffae'), br), .2), code(br), 0); }
  // ribbon tie, bow and tails
  [100.6, 102, 103.4].forEach((y, row) => { for (let k = 0; k < 22; k++) { const a = k / 22 * PI2; addS(50 + 3.9 * Math.cos(a), y, 3.9 * Math.sin(a), 0, 3.6, 1.2, jit(TIE[row === 1 ? 1 : 0], .15), code(row === 1 ? .85 : .6), 0); } });
  [-1, 1].forEach(sd => {
    for (let k = 0; k < 18; k++) { const a = k / 18 * PI2; addS(50 + sd * 4.4 + Math.cos(a) * 3.2, 99.2 + Math.sin(a) * 2, 4.4, 0, 4.2, 1, jit(TIE[1], .2), code(.8), 0); }
    for (let y = 101; y < 113; y += 1.1) addS(50 + sd * (1.5 + (y - 101) * .22), y, 4.8, 0, 4.4, 1, jit(TIE[0], .2), code(.7), 0);
  });
  addS(50, 100, 5, 0, 4.2, 1, TIE[1], RAMP.length - 1, 0);
  // semi-transparent hexagonal wrapping paper with folds and a ruffled rim
  { const APEX_Y = 96, RIM_Y = 30, RIM_R = 44, HEXC = Math.cos(Math.PI / 6);
    for (let a = 1; a <= 78; a++) { const v = a / 78, rv = Math.pow(v, .45), nphi = Math.max(8, Math.round(PI2 * RIM_R * rv / 1.2));
      for (let k = 0; k < nphi; k++) {
        const phi = (k + rnd() * .6) / nphi * PI2, m = ((phi % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3);
        const rh = RIM_R * HEXC / Math.cos(m - Math.PI / 6), rimY = RIM_Y + 2.5 * (1 - Math.cos(6 * phi)), f = m / (Math.PI / 3), fold = f < .05 || f > .95, rim = v > .96;
        const br = rim ? .8 : fold ? .6 : .38 + .15 * Math.sin(v * 9 + phi * 3) + .12 * rnd();
        addS(50 + rv * rh * Math.cos(phi), APEX_Y + v * (rimY - APEX_Y), rv * rh * Math.sin(phi), v, 3, 3.2, jit(th.paper, .2).map(c => c * br / .6), rim ? 4 + (k & 1) : code(br, RAMP_P), rim ? 52 : fold ? 46 : 40);
      } } }
  const leaf = (ax, ay, az, d0, len, wid, t0, flat, Lf) => {
    const d = norm(d0), p1 = norm(cross(d, flat ? [0, 0, 1] : [rnd() - .5, rnd() - .5, rnd() - .5])), p2 = cross(d, p1), nv = Math.ceil(len / 1.1), dr = Lf.droop || .22;
    for (let k = 0; k <= 5; k++) for (const o of [0, .7]) addS(ax - d[0] * k * 1.1, ay - d[1] * k * 1.1 + o, az - d[2] * k * 1.1, 0, t0, 1, jit(GREEN[1], .2), code(.4), 0);   // petiole joins leaf to bouquet
    for (let a = 0; a <= nv; a++) {
      const v = a / nv, wv = wid * (Lf.strap ? (v < .1 ? v / .1 : 1) * (1 - Math.pow(v, 3.5)) : Math.pow(Math.sin(Math.PI * Math.min(1, v * .95 + .05)), .8) * (v < .08 ? v / .08 : 1)), nu = Math.max(1, Math.round(wv * 2 / 1.1));
      for (let b = 0; b <= nu; b++) {
        const u = b / nu * 2 - 1, lat = u * wv, edge = Math.abs(u) > .85 || a === nv, f = .18 * Math.abs(lat);
        if (Lf.serr && edge && a % 2) continue;
        const br = edge ? .85 : Math.abs(u) < .12 ? .7 : .35 + .3 * rnd() + .1 * v;
        addS(ax + d[0] * len * v + p1[0] * lat + p2[0] * f, ay + d[1] * len * v + p1[1] * lat + p2[1] * f + dr * len * v * v, az + d[2] * len * v + p1[2] * lat + p2[2] * f, v, t0, 1.6, jit(mix(GREEN[0], GREEN[3], br), .2), code(br), 0);
      }
    }
  };
  // one flower head, built petal by petal; returns how long it takes to bloom
  const addHead = (rose, R, Rb, pal) => {
    let maxPd = 0; const range = fn => { const a0 = RP.x0.length; fn(); rose.lay.push([a0, RP.x0.length]); };
    const L = H.layers ? H.layers.length : 1, ld = H.ld || .28, qd = H.qd || .04;
    const haloPts = () => {   // blank dark backing behind the head so it reads against the foliage
      const rad = Rb * H.halo, K = Math.round(Math.PI * rad * rad / 1.1);
      for (let k = 0; k < K; k++) { const r = rad * Math.sqrt((k + .5) / K), a = k * 2.39996; rp([r * Math.cos(a) * .3, r * Math.sin(a) * .3, -2], [r * Math.cos(a) * .7, r * Math.sin(a) * .7, -2.4], [r * Math.cos(a), r * Math.sin(a), -2.8], 0, [0, 0, 0], 200); }
    };
    if (H.florets) range(() => {   // hydrangea: a ball of small four-petal florets
      const K = Math.round(2 * Math.PI * R * R * .95 / 6), dp = 1.35, offs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]];
      for (let k = 0; k < K; k++) {
        const th2 = Math.acos(1 - (k + .5) / K * (1 - Math.cos(1.5))), ps = k * 2.39996, st = Math.sin(th2), ct = Math.cos(th2);
        const c0 = [R * .85 * st * Math.cos(ps), R * .85 * st * Math.sin(ps), R * .85 * ct], t1 = [ct * Math.cos(ps), ct * Math.sin(ps), -st], t2 = [-Math.sin(ps), Math.cos(ps), 0], nn = [st * Math.cos(ps), st * Math.sin(ps), ct];
        const base = mix(pal[0], pal[2], rnd()), pd = k / K * 1.3 + rnd() * .3; maxPd = Math.max(maxPd, pd);
        offs.forEach(([ox, oy], i) => {
          const lift = .5 * (1 - (ox * ox + oy * oy) * .5), P = (s, hh, g) => [c0[0] * s + (t1[0] * ox + t2[0] * oy) * dp * g + nn[0] * hh, c0[1] * s + (t1[1] * ox + t2[1] * oy) * dp * g + nn[1] * hh, c0[2] * s + (t1[2] * ox + t2[2] * oy) * dp * g + nn[2] * hh];
          const o = P(1, lift, 1), c = P(.55, lift * .4, .35), md = P(.78, lift * .7, .7), br = i === 0 ? .9 : .4 + rnd() * .35 + .15 * ct;
          rp(c, md, o, pd, jit(i === 0 ? mix(base, [255, 245, 200], .55) : mix(base, [255, 255, 255], (br - .5) * .4), .15), i === 0 ? RAMP.length - 5 : code(br));
        });
      }
      if (H.halo) haloPts();
    });
    else {
      (H.layers).forEach((Ly, l) => range(() => { for (let q = 0; q < Ly.n; q++) {
        const phi = q / Ly.n * PI2 + (Ly.off || 0) + rnd() * (H.jit || .3), Lp = Rb * Ly.len, half = Lp * Ly.wid, r0 = Rb * Ly.r0, cup = Ly.cup ?? 1, tip = Ly.tip || 'round', pd = l * ld + q * qd; maxPd = Math.max(maxPd, pd);
        const nv = Math.max(4, Math.round(Lp / .95)), nu = Math.max(2, Math.round(2 * half / .95));
        for (let a = 0; a < nv; a++) {
          const v = Math.min(1, (a + .5 + (rnd() - .5) * .5) / nv), wv = half * (.3 + .7 * Math.sqrt(v)) * (1 - .2 * v * v);
          for (let b = 0; b < nu; b++) {
            const u = (b + .5 + (rnd() - .5) * .5) / nu * 2 - 1;
            if (tip === 'point' ? Math.abs(u) > (v < .55 ? 1 : Math.max(0, (1 - v) / .45)) : tip === 'serr' ? (v >= .84 && (.5 + .5 * Math.cos(u * Math.PI * 6)) <= (v - .84) / .16) : Math.abs(u) > (v < .8 ? 1 : Math.sqrt(Math.max(0, 1 - Math.pow((v - .8) / .2, 2))))) continue;
            const lat = u * wv, geo = al => {
              const a2 = al + Ly.curl * v * .6, rad = r0 + Lp * v * Math.sin(a2) * (1 - .3 * u * u * cup), ax = Lp * v * Math.cos(a2) + .07 * lat * lat + Ly.rip * v * v * v * Math.sin(u * 4 + phi * 2);
              if (Ly.wrap) { const dl = lat / Math.max(rad, .8); return [rad * Math.cos(phi + dl), rad * Math.sin(phi + dl), ax]; }
              return [rad * Math.cos(phi) - lat * Math.sin(phi), rad * Math.sin(phi) + lat * Math.cos(phi), ax];
            };
            const o = geo(Ly.ao), c = geo(Ly.ac), md = geo((Ly.ao + Ly.ac) / 2), tc = clamp01((H.tcb || 0) + .26 + .5 * v + (H.lc ?? .14) * l / Math.max(1, L - 1) + (rnd() - .5) * .12 + .05 * Math.cos(u * 7)), edge = Math.abs(u) > .86 || v > .9;
            let rgb = tc < .5 ? mix(pal[0], pal[1], tc * 2) : mix(pal[1], pal[2], (tc - .5) * 2), ch = code(tc + (edge ? .1 : 0));
            if (edge) rgb = mix(rgb, [255, 235, 240], .1);
            if (H.spots && v > .12 && v < .6 && rnd() < .1) { rgb = [130, 25, 75]; ch = RAMP.length - 3; }
            rp(c, md, o, pd, rgb, ch);
          }
        }
      } }));
      if (H.disc) range(() => {   // sunflower seed disc: a Fibonacci spiral of dark seeds
        const rd = Rb * H.disc, K = Math.round(Math.PI * rd * rd / .95);
        for (let k = 0; k < K; k++) { const r = rd * Math.sqrt((k + .5) / K), a = k * 2.39996, t = r / rd, z = .22 * Math.sqrt(Math.max(0, rd * rd - r * r));
          rp([r * Math.cos(a) * .5, r * Math.sin(a) * .5, z + .5], [r * Math.cos(a) * .8, r * Math.sin(a) * .8, z + .2], [r * Math.cos(a), r * Math.sin(a), z], 0, rnd() < .12 ? [214, 168, 70] : jit(mix([46, 22, 9], [118, 64, 16], Math.pow(t, 1.1)), .35), code(.5 + .4 * t)); }
      });
      if (H.halo) range(haloPts);
      if (H.stamens) range(() => {    // lily stamens with rust-coloured anthers
        const pd = L * ld * .9, Ls = Rb * 1.05; maxPd = Math.max(maxPd, pd);
        for (let s = 0; s < H.stamens; s++) { const f = s / H.stamens * PI2 + .3, cf = Math.cos(f), sf = Math.sin(f);
          for (let k = 0; k <= 9; k++) { const u = k / 9; rp([cf * Ls * .04 * u, sf * Ls * .04 * u, Ls * (.2 + .6 * u)], [cf * Ls * .25 * u, sf * Ls * .25 * u, Ls * (.2 + .58 * u)], [cf * Ls * .5 * u, sf * Ls * .5 * u, Ls * (.2 + .55 * u)], pd, jit([205, 220, 150], .2), code(.35)); }
          for (let k = 0; k < 6; k++) { const ox = (rnd() - .5) * 1.2, oy = (rnd() - .5) * 1.2; rp([cf * Ls * .04 + ox * .3, sf * Ls * .04 + oy * .3, Ls * .8], [cf * Ls * .25 + ox * .6, sf * Ls * .25 + oy * .6, Ls * .78], [cf * Ls * .5 + ox, sf * Ls * .5 + oy, Ls * .75], pd, jit([196, 86, 26], .3), RAMP.length - 1); } }
      });
    }
    return maxPd + 2.2;
  };
  // heads on an ellipsoid dome (tulips and lilies lean upward)
  for (let i = 0; i < N; i++) {
    const bb = Math.acos(1 - (1 - Math.cos(BMAX)) * (i + .5) / N), gg = i * 2.39996 + rnd() * .2, ex = AX * Math.sin(bb) * Math.cos(gg), ey = -AY * Math.cos(bb), ez = AZ * Math.sin(bb) * Math.sin(gg);
    const n0 = norm([ex / (AX * AX), ey / (AY * AY), ez / (AZ * AZ)]), nz = norm([n0[0] * (1 - V.up), n0[1] * (1 - V.up) - V.up, n0[2] * (1 - V.up)]);
    let bx = cross([0, -1, 0], nz); bx = Math.hypot(bx[0], bx[1], bx[2]) < .1 ? [1, 0, 0] : norm(bx);
    const by = cross(nz, bx), R = V.R[0] + rnd() * (V.R[1] - V.R[0]), pal = V.pals[Math.floor(rnd() * V.pals.length)].map(hex);
    const rose = { p: [50 + ex, CY + ey, ez], bx, by, bz: nz, key: bb + rnd() * .5, bud: 2.8 + rnd() * 2.2, t0: 0, lay: [], dur: 0 };
    rose.dur = addHead(rose, R, R * .76, pal); roses.push(rose);
    const B = [rose.p[0] - nz[0] * R * .5, rose.p[1] - nz[1] * R * .5, rose.p[2] - nz[2] * R * .5], F = [50, 96, 0], t0 = 2.4 + rnd() * 1.8;
    const M = [(F[0] + B[0]) / 2 + (rnd() - .5) * 5, (F[1] + B[1]) / 2, (F[2] + B[2]) / 2 + (rnd() - .5) * 5], n = Math.ceil(Math.hypot(B[0] - F[0], B[1] - F[1], B[2] - F[2]));
    for (let s = 0; s <= n; s++) { const u = s / n, w2 = 1 - u; for (const off of [-.7, 0, .7]) addS(w2 * w2 * F[0] + 2 * w2 * u * M[0] + u * u * B[0] + off, w2 * w2 * F[1] + 2 * w2 * u * M[1] + u * u * B[1], w2 * w2 * F[2] + 2 * w2 * u * M[2] + u * u * B[2] + (rnd() - .5) * .8, u, t0, 2, jit(mix(GREEN[1], GREEN[2], rnd()), .3), code(.3 + rnd() * .4), 0); }
  }
  const D = roses[0].dur; [...roses].sort((a, b) => a.key - b.key).forEach((r, i) => { r.t0 = 4.4 + i / Math.max(1, N - 1) * Math.max(2, 15.4 - 4.4 - D); });
  roses.sort((a, b) => a.p[1] - b.p[1]);
  const Lv = V.leaves;   // foliage tucked under the heads, plus four side leaves growing out of the dome
  for (let i = 0; i < Lv.n; i++) {
    const bb = .3 + rnd() * 2, gg = rnd() * PI2, ex = lsh * AX * Math.sin(bb) * Math.cos(gg), ey = -lsh * AY * Math.cos(bb), ez = lsh * AZ * Math.sin(bb) * Math.sin(gg), nz = norm([ex / (AX * AX), ey / (AY * AY), ez / (AZ * AZ)]);
    leaf(50 + ex, CY + ey, ez, [nz[0] + (rnd() - .5) * .6, nz[1] + .25 + (rnd() - .5) * .4, nz[2] + (rnd() - .5) * .6], Lv.len[0] + rnd() * (Lv.len[1] - Lv.len[0]), Lv.wid[0] + rnd() * (Lv.wid[1] - Lv.wid[0]), 3 + rnd() * 4, false, Lv);
  }
  [[0, 1.5], [Math.PI, 1.5], [.12, 1.75], [Math.PI - .12, 1.75]].forEach(([g, bb], i) => {
    const ex = .93 * AX * Math.sin(bb) * Math.cos(g), ey = -.93 * AY * Math.cos(bb), ez = .93 * AZ * Math.sin(bb) * Math.sin(g), nz = norm([ex / (AX * AX), ey / (AY * AY), ez / (AZ * AZ)]);
    leaf(50 + ex, CY + ey, ez, [nz[0] * 1.2, nz[1] + .55, nz[2] * .6], V.side[0] + (i % 2) * 2, V.side[1], 4.2 + i * .3, true, Lv);
  });
  NS = A.x.length; SX = Float32Array.from(A.x); SY = Float32Array.from(A.y); SZ = Float32Array.from(A.z); SP = Float32Array.from(A.p); ST = Float32Array.from(A.t); SD = Float32Array.from(A.d);
  SR = Uint8ClampedArray.from(A.r); SG = Uint8ClampedArray.from(A.g); SB = Uint8ClampedArray.from(A.b); SC = Uint8Array.from(A.c); SK = Uint8Array.from(A.k);
  XM = Float32Array.from(RP.xm); YM = Float32Array.from(RP.ym); ZM = Float32Array.from(RP.zm); PD = Float32Array.from(RP.d); X0 = Float32Array.from(RP.x0); Y0 = Float32Array.from(RP.y0); Z0 = Float32Array.from(RP.z0); X1 = Float32Array.from(RP.x1); Y1 = Float32Array.from(RP.y1); Z1 = Float32Array.from(RP.z1);
  RR = Uint8ClampedArray.from(RP.r); RG = Uint8ClampedArray.from(RP.g); RB = Uint8ClampedArray.from(RP.b); RC = Uint8Array.from(RP.c);
  const early = [...roses].sort((a, b) => a.t0 - b.t0).slice(0, Math.min(12, N));
  petalDefs = Array.from({ length: 7 }, (_, j) => ({ x: 28 + rnd() * 44, y: 40 + rnd() * 14, ph: j * .9, L: 9 + rnd() * 4, vy: 7 + rnd() * 3, dr: (rnd() - .5) * 3, ch: '`*o\''[j % 4], col: th.fall[j % 4], j }));
}

/* ---------- Layout, backdrop and z-buffer ---------- */
let w = 0, h = 0, dpr = 1, S = 1, ox = 0, oy = 0, cw = 6, chh = 8, cols = 0, rows = 0, fontStr = '', stars = [], crosses = [], plus = [], bgc = null;
let ZO, ZS, CO, CS, RO, GO, BO, RS, GS, BS, AS;
function buildBg() {
  const th = V.theme; bgc = document.createElement('canvas'); bgc.width = canvas.width; bgc.height = canvas.height;
  const bg = bgc.getContext('2d'); bg.fillStyle = th.base; bg.fillRect(0, 0, bgc.width, bgc.height);
  for (const [nx, ny, nr, nc, na] of th.blobs) {
    const rad = nr * Math.max(bgc.width, bgc.height), gr = bg.createRadialGradient(nx * bgc.width, ny * bgc.height, 0, nx * bgc.width, ny * bgc.height, rad);
    gr.addColorStop(0, `rgba(${nc},${na})`); gr.addColorStop(1, `rgba(${nc},0)`); bg.fillStyle = gr; bg.fillRect(0, 0, bgc.width, bgc.height);
  }
  const r = mulberry32(7), cs = th.stars, pick = () => cs[Math.floor(r() * cs.length)], area = w * h;
  stars = []; crosses = []; plus = [];
  for (let i = 0; i < Math.min(900, area / 1800); i++) stars.push({ x: r(), y: r(), s: r() < .2 ? 2 : 1, ph: r() * 6.28, sp: .8 + r() * 2.6, a: .45 + r() * .55, c: pick(), dp: .15 + r() * .85 });
  for (let i = 0; i < Math.min(320, area / 5500); i++) plus.push({ x: r(), y: r(), ph: r() * 6.28, sp: .5 + r() * 1.5, a: .45 + r() * .55, c: pick(), dp: .2 + r() * .8 });
  for (let i = 0; i < 14; i++) crosses.push({ x: .04 + r() * .92, y: .03 + r() * .88, L: 14 + r() * 30, ph: r() * 6.28, sp: .6 + r() * 1.4, c: pick(), d8: r() < .4 });
  const rs = document.documentElement.style; rs.setProperty('--pink', th.accent); rs.setProperty('--pale', th.pale); rs.setProperty('--heart', th.heart);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', th.base);
}
function resize() {
  w = window.innerWidth; h = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  S = Math.min(w * .94 / 96, h * .78 / 100); ox = w / 2 - 50 * S; oy = h * .06 - 18 * S + Math.max(0, (h * .78 - 102 * S) / 2);
  const fs = Math.max(6, Math.min(14, S * 1.55)); cw = fs * .6; chh = fs * .95; fontStr = `${fs}px "Courier New", ui-monospace, monospace`;
  cols = Math.ceil(w / cw) + 2; rows = Math.ceil(h / chh) + 2; const n = cols * rows;
  ZO = new Float32Array(n); ZS = new Float32Array(n); CO = new Uint8Array(n); CS = new Uint8Array(n);
  RO = new Uint8Array(n); GO = new Uint8Array(n); BO = new Uint8Array(n); RS = new Uint8Array(n); GS = new Uint8Array(n); BS = new Uint8Array(n); AS = new Uint8Array(n);
  buildBg(); if (paused || reduce) draw();
}

/* ---------- State and drawing ---------- */
let T = reduce ? CFG.duration + 1 : 0, theta = reduce ? .35 : 0, paused = false, raf = 0, last = 0, typed = -1, lastHud = '', lastStat = '';
const PC = Math.cos(CFG.pitch), PS = Math.sin(CFG.pitch);
function plot(x, y, z, ch, r, g, b, k, c, s) {
  const dx = x - 50, xr = dx * c + z * s, z0 = -dx * s + z * c, yy = y - 80, zr = z0 * PC - yy * PS, yr = yy * PC + z0 * PS, pf = 1 / (1 - zr * .0035);
  const col = Math.round((ox + (50 + xr * pf) * S) / cw), row = Math.round((oy + (80 + yr * pf) * S) / chh);
  if (col < 0 || col >= cols || row < 0 || row >= rows) return;
  const ci = row * cols + col, df = .7 + .3 * clamp01((zr + 40) / 80);
  if (k) { if (zr > ZS[ci]) { ZS[ci] = zr; CS[ci] = ch; RS[ci] = r * df; GS[ci] = g * df; BS[ci] = b * df; AS[ci] = k; } }
  else if (zr > ZO[ci]) { ZO[ci] = zr; CO[ci] = ch; RO[ci] = r * df; GO[ci] = g * df; BO[ci] = b * df; }
}
function drawStars() {
  const off = theta * 22;   // stars drift with the spin for a little parallax
  for (const st of stars) { const x = (((st.x * w + off * st.dp) % w) + w) % w; ctx.globalAlpha = st.a * (.35 + .65 * (.5 + .5 * Math.sin(T * st.sp + st.ph))); ctx.fillStyle = st.c; ctx.fillRect(x, st.y * h, st.s, st.s); }
  ctx.font = '10px "Courier New", monospace';
  for (const p of plus) { const x = (((p.x * w + off * p.dp) % w) + w) % w; ctx.globalAlpha = p.a * (.3 + .7 * (.5 + .5 * Math.sin(T * p.sp + p.ph))); ctx.fillStyle = p.c; ctx.fillText('+', x, p.y * h); }
  ctx.lineWidth = 1;
  for (const c of crosses) {
    const x = (((c.x * w + off * .6) % w) + w) % w, y = c.y * h, al = .45 + .55 * (.5 + .5 * Math.sin(T * c.sp + c.ph)), n = c.d8 ? 8 : 4;
    ctx.strokeStyle = c.c; ctx.fillStyle = c.c;
    for (let k = 0; k < n; k++) {
      const a = k * Math.PI * 2 / n, L = c.L * (k % 2 && n === 8 ? .55 : 1), ca = Math.cos(a), sa = Math.sin(a);
      ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + ca * L * .5, y + sa * L * .5); ctx.stroke();
      ctx.globalAlpha = al * .4; ctx.beginPath(); ctx.moveTo(x + ca * L * .5, y + sa * L * .5); ctx.lineTo(x + ca * L, y + sa * L); ctx.stroke();
    }
    ctx.globalAlpha = .25 * al; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.fill(); ctx.globalAlpha = al; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  const k = Math.floor(T / 6), ph = (T - k * 6) / .9;   // an occasional shooting star
  if (ph < 1 && T > 1) {
    const hx = ((k * 9301 + 49297) % 233280) / 233280, hy = ((k * 7919 + 1234) % 233280) / 233280, x0 = w * (.1 + .6 * hx) + ph * 200, y0 = h * (.04 + .3 * hy) + ph * 100;
    ctx.strokeStyle = '#fff'; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - 70, y0 - 35); ctx.stroke();
  }
}
function draw() {
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(bgc, 0, 0, w, h);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; drawStars();
  const gx = ox + 50 * S, gy = oy + 55 * S, gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, 55 * S), gp = clamp01((T - 4) / 8);
  gr.addColorStop(0, `rgba(${V.theme.glow},.14)`); gr.addColorStop(1, `rgba(${V.theme.glow},0)`); ctx.globalAlpha = gp; ctx.fillStyle = gr; ctx.fillRect(gx - 55 * S, gy - 55 * S, 110 * S, 110 * S);
  ZO.fill(-1e9); ZS.fill(-1e9);
  const c = Math.cos(theta), s = Math.sin(theta);
  for (let i = 0; i < NS; i++) {
    const t = ST[i]; if (T < t) continue;
    if (SP[i] > easeOut(clamp01((T - t) / SD[i]))) continue;
    plot(SX[i], SY[i], SZ[i], SC[i], SR[i], SG[i], SB[i], SK[i], c, s);
  }
  let open = 0;
  for (const R of roses) {
    const bud = easeOut(clamp01((T - R.bud) / 1.2)); if (bud <= 0) continue;
    const [bx, by, bz, p] = [R.bx, R.by, R.bz, R.p];
    if (T >= R.t0 + R.dur) open++;
    for (let l = 0; l < R.lay.length; l++) {
      const rg = R.lay[l];
      for (let i = rg[0]; i < rg[1]; i++) {
        const q = clamp01((T - R.t0 - PD[i]) / 2.2), e = q * q * q * (q * (q * 6 - 15) + 10), m = .3 + .7 * e;
        const wa = (1 - e) * (1 - 2 * e), wb = 4 * e * (1 - e), wc = e * (2 * e - 1);   // smooth arc through closed, half-open, open
        const lx = (X0[i] * wa + XM[i] * wb + X1[i] * wc) * bud, ly = (Y0[i] * wa + YM[i] * wb + Y1[i] * wc) * bud, lz = (Z0[i] * wa + ZM[i] * wb + Z1[i] * wc) * bud;
        plot(p[0] + lx * bx[0] + ly * by[0] + lz * bz[0], p[1] + lx * bx[1] + ly * by[1] + lz * bz[1], p[2] + lx * bx[2] + ly * by[2] + lz * bz[2], RC[i],
          BUD[0] + (RR[i] - BUD[0]) * m, BUD[1] + (RG[i] - BUD[1]) * m, BUD[2] + (RB[i] - BUD[2]) * m, 0, c, s);
      }
    }
  }
  ctx.font = fontStr; ctx.globalAlpha = 1; let lr = -1, lg = -1, lb = -1;
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const ci = row * cols + col, hasO = ZO[ci] > -1e8, hasS = ZS[ci] > -1e8;
    if (!hasO && !hasS) continue;
    const px = col * cw, py = row * chh;
    if (hasO) { if (RO[ci] !== lr || GO[ci] !== lg || BO[ci] !== lb) { lr = RO[ci]; lg = GO[ci]; lb = BO[ci]; ctx.fillStyle = `rgb(${lr},${lg},${lb})`; } if (RAMP[CO[ci]]) ctx.fillText(RAMP[CO[ci]], px, py); }
    if (hasS && ZS[ci] > ZO[ci]) { ctx.globalAlpha = AS[ci] / 100 * (hasO ? 1 : 1.2); ctx.fillStyle = `rgb(${RS[ci]},${GS[ci]},${BS[ci]})`; lr = -1; ctx.fillText(RAMP_P[CS[ci] % RAMP_P.length] || '.', px, py); ctx.globalAlpha = 1; }
  }
  let falling = 0;
  if (T >= 12) for (const d of petalDefs) {
    const loc = T - 12 - d.ph; if (loc < 0) continue;
    const cc = loc % d.L, x = d.x + Math.sin(cc * 1.3 + d.j) * 3 + d.dr * cc, y = d.y + cc * d.vy; if (y > 146) continue;
    falling++; ctx.globalAlpha = .9 * (1 - clamp01((y - 130) / 16)); ctx.fillStyle = d.col; ctx.fillText(d.ch, ox + x * S, oy + y * S);
  }
  ctx.globalAlpha = 1;
  const full = CFG.word + ' ' + CFG.heart, n = T < CFG.captionStart ? 0 : Math.min(full.length, Math.floor((T - CFG.captionStart) * full.length / 1.2) + 1);
  if (n !== typed) { typed = n; const t = full.slice(0, n); cap1.textContent = t.slice(0, CFG.word.length); cap2.textContent = t.slice(CFG.word.length); }
  const hs = `● t ${Math.min(T, CFG.duration).toFixed(2)}s`; if (hs !== lastHud) { lastHud = hs; hud.textContent = hs; }
  const fill = Math.round(clamp01(T / CFG.duration) * 12), ss = `> [${'#'.repeat(fill)}${'-'.repeat(12 - fill)}] ${V.plural} open ${open}/${roses.length} | petals falling ${falling}`;
  if (ss !== lastStat) { lastStat = ss; statusEl.textContent = ss; }
}

/* ---------- Loop, controls, bouquet picker ---------- */
function tick(ts) {
  raf = requestAnimationFrame(tick);
  if (ts - last < (T > CFG.duration + 1 ? 31 : 14)) return;
  const dt = Math.min(.1, (ts - last) / 1000); last = ts; T += dt;
  theta += CFG.spin * (function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; })(clamp01((T - 2) / 3)) * dt; draw();
}
function start() { if (!raf && !paused && !reduce) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
function setPaused(v) { paused = v; btnPause.textContent = v ? 'Resume' : 'Pause'; btnPause.setAttribute('aria-pressed', String(v)); if (v) { stop(); draw(); } else start(); }
function setVariant(key, fromUser) {
  if (!VARIANTS[key]) key = CFG.start;
  stop(); roses = []; build(key); T = reduce ? CFG.duration + 1 : 0; theta = reduce ? .35 : 0; typed = -1; paused = false; btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
  buildBg(); canvas.setAttribute('aria-label', `An animated bouquet of ${V.plural}, drawn in text characters, wrapped in paper and tied with a ribbon, growing and slowly spinning under a twinkling night sky. It ends with the words For You.`);
  if (picker) for (const b of picker.children) b.setAttribute('aria-pressed', String(b.dataset.k === key));
  if (fromUser && history.replaceState) history.replaceState(null, '', '#' + key);
  draw(); start();
}
if (picker && Object.keys(VARIANTS).length > 1) Object.keys(VARIANTS).forEach(k => { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = VARIANTS[k].label; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => setVariant(k, true)); picker.appendChild(b); });
btnPause.addEventListener('click', () => setPaused(!paused));
btnReplay.addEventListener('click', () => { T = 0; theta = 0; typed = -1; setPaused(false); draw(); start(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
let rz = 0; window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(resize); });
if (reduce) document.getElementById('controls').hidden = true;
window.addEventListener('hashchange', () => { const k = location.hash.slice(1); if (VARIANTS[k] && k !== VK) setVariant(k, false); });
build(VARIANTS[location.hash.slice(1)] ? location.hash.slice(1) : CFG.start); resize(); setVariant(VK, false);
})();
