/* SMASH TRUCK — procedural SVG burger builder.
 * Every layer is its own <svg> so it can be moved on the GPU (transform only),
 * which is what keeps the exploded view at 60fps. Shared gradients/filters live
 * in the hidden <svg id="defs"> in index.html. */
(function () {
  'use strict';

  const W = 600;
  const n1 = (v) => Math.round(v * 10) / 10;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Smooth organic closed shape around an ellipse.
  function blob(cx, cy, rx, ry, n, amp, r) {
    const p = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const k = 1 + (r() - 0.5) * amp;
      p.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
    }
    let d = '';
    for (let i = 0; i < n; i++) {
      const a = p[i], b = p[(i + 1) % n], z = p[(i - 1 + n) % n];
      if (!i) d += `M${n1((z[0] + a[0]) / 2)},${n1((z[1] + a[1]) / 2)}`;
      d += ` Q${n1(a[0])},${n1(a[1])} ${n1((a[0] + b[0]) / 2)},${n1((a[1] + b[1]) / 2)}`;
    }
    return d + 'Z';
  }

  // Jagged "crispy lace" edge — straight segments, alternating spikes.
  function lace(cx, cy, rx, ry, n, r) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      let k = 1 + (r() - 0.5) * 0.06;
      if (i % 2) k -= 0.03 + r() * 0.07;
      else k += r() * 0.035;
      d += (i ? ' L' : 'M') + n1(cx + Math.cos(t) * rx * k) + ',' + n1(cy + Math.sin(t) * ry * k);
    }
    return d + 'Z';
  }

  // Bottom edge running right→left with gravity drips (cheese / sauce).
  function dripEdge(x0, x1, base, bulge, drips) {
    const y = (x) => base + bulge * Math.sin((Math.PI * (x - x0)) / (x1 - x0));
    let d = ` L${x1},${n1(y(x1))}`;
    drips.slice().sort((a, b) => b.x - a.x).forEach(({ x, w, len }) => {
      const yb = y(x);
      d += ` L${n1(x + w)},${n1(y(x + w))}` +
        ` C${n1(x + w * 0.35)},${n1(yb + len * 0.45)} ${n1(x + w * 0.95)},${n1(yb + len)} ${n1(x)},${n1(yb + len)}` +
        ` C${n1(x - w * 0.95)},${n1(yb + len)} ${n1(x - w * 0.35)},${n1(yb + len * 0.45)} ${n1(x - w)},${n1(y(x - w))}`;
    });
    return d + ` L${x0},${n1(y(x0))}`;
  }

  /* Each layer: vh = drawing height, top = y of the surface the next layer sits on,
   * base = y of the line this layer rests on. draw(r, opt) → inner SVG markup. */
  const LAYERS = {
    bunBottom: {
      vh: 96, top: 14, base: 86,
      draw(r, o) {
        const dark = o.bun === 'charcoal';
        return `
        <path d="M40,14 Q300,0 560,14 Q586,18 582,42 Q574,82 512,88 Q300,96 88,88 Q26,82 18,42 Q14,18 40,14Z" fill="url(#${dark ? 'gBunBotDark' : 'gBunBot'})"/>
        <path d="M30,50 Q300,74 570,50 Q566,70 540,80 Q300,92 60,80 Q34,70 30,50Z" fill="#000" opacity=".22"/>
        <path d="M46,14 Q300,-2 554,14 Q568,22 550,28 Q300,42 50,28 Q32,22 46,14Z" fill="url(#${dark ? 'gToastDark' : 'gToast'})" filter="url(#fSear)"/>
        <path d="M70,48 Q140,60 220,62" stroke="#fff" stroke-opacity=".18" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      }
    },

    patty: {
      vh: 64, top: 18, base: 44,
      draw(r) {
        let holes = '';
        for (let i = 0; i < 16; i++) {
          const t = r() * Math.PI * 2;
          holes += `<ellipse cx="${n1(300 + Math.cos(t) * 284)}" cy="${n1(26 + Math.sin(t) * 29)}" rx="${n1(2 + r() * 4)}" ry="${n1(1 + r() * 2)}" fill="#140803" opacity=".7"/>`;
        }
        let glint = '';
        for (let i = 0; i < 14; i++) {
          glint += `<ellipse cx="${n1(90 + r() * 420)}" cy="${n1(12 + r() * 24)}" rx="${n1(3 + r() * 10)}" ry="${n1(0.8 + r() * 1.8)}" fill="#ffd9a0" opacity="${n1(0.2 + r() * 0.35)}"/>`;
        }
        return `
        <path d="${lace(300, 26, 300, 33, 110, r)}" fill="url(#gLace)"/>
        ${holes}
        <path d="M22,26 A278,24 0 0 0 578,26 L578,42 Q300,76 22,42Z" fill="url(#gPattySide)"/>
        <path d="${blob(300, 24, 276, 23, 44, 0.05, r)}" fill="url(#gPattyTop)" filter="url(#fSear)"/>
        ${glint}`;
      }
    },

    cheese: {
      vh: 130, top: 10, base: 24,
      draw(r, o) {
        const heavy = o.cheese === 'heavy';
        const drips = heavy
          ? [{ x: 44, w: 26, len: 84 }, { x: 150, w: 18, len: 52 }, { x: 250, w: 22, len: 96 }, { x: 350, w: 16, len: 44 }, { x: 440, w: 22, len: 88 }, { x: 552, w: 26, len: 74 }]
          : [{ x: 58, w: 22, len: 58 }, { x: 196, w: 15, len: 34 }, { x: 322, w: 20, len: 68 }, { x: 452, w: 14, len: 30 }, { x: 542, w: 24, len: 62 }];
        drips.forEach((d) => { d.len *= 0.85 + r() * 0.3; });
        const d = `M18,18 Q300,-12 582,18` + dripEdge(18, 582, 20, 16, drips) + 'Z';
        let spec = '';
        drips.forEach((q) => { spec += `<ellipse cx="${n1(q.x - q.w * 0.3)}" cy="${n1(28 + q.len * 0.72)}" rx="${n1(q.w * 0.18)}" ry="${n1(q.w * 0.35)}" fill="#fff" opacity=".45"/>`; });
        return `
        <path d="${d}" fill="url(#gCheese)"/>
        <path d="M24,18 Q300,-10 576,18 Q300,8 24,18Z" fill="#fff6c9" opacity=".55"/>
        <path d="M120,16 Q260,2 380,8" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${spec}`;
      }
    },

    pickles: {
      vh: 44, top: 8, base: 22,
      draw(r) {
        let s = '';
        [[54, 16], [150, 10], [250, 14], [350, 10], [452, 14], [548, 18]].forEach(([x, y]) => {
          const rx = 38 + r() * 8, ry = 12 + r() * 3, rot = (r() - 0.5) * 14;
          let seeds = '';
          for (let i = 0; i < 6; i++) {
            const t = (i / 6) * Math.PI * 2 + r();
            seeds += `<ellipse cx="${n1(Math.cos(t) * rx * 0.42)}" cy="${n1(Math.sin(t) * ry * 0.42)}" rx="3" ry="1.4" fill="#f3f1c4" opacity=".8"/>`;
          }
          s += `<g transform="translate(${n1(x)},${n1(y)}) rotate(${n1(rot)})">
            <ellipse rx="${n1(rx + 3)}" ry="${n1(ry + 3)}" fill="#34490f"/>
            <ellipse rx="${n1(rx + 1.5)}" ry="${n1(ry + 1.5)}" fill="none" stroke="#1f2e08" stroke-width="2.5" stroke-dasharray="3 4"/>
            <ellipse rx="${n1(rx)}" ry="${n1(ry)}" fill="url(#gPickle)"/>
            <ellipse rx="${n1(rx * 0.6)}" ry="${n1(ry * 0.55)}" fill="#dfe79a" opacity=".45"/>
            ${seeds}
            <ellipse cx="${n1(-rx * 0.3)}" cy="${n1(-ry * 0.4)}" rx="${n1(rx * 0.3)}" ry="2" fill="#fff" opacity=".35"/>
          </g>`;
        });
        return s;
      }
    },

    onions: {
      vh: 40, top: 6, base: 14,
      draw(r) {
        let s = '';
        for (let i = 0; i < 16; i++) {
          const x = 30 + r() * 540, y = 6 + r() * 12, w = 18 + r() * 26, h = 6 + r() * 10;
          const edge = x < 70 || x > 530;
          const c = r() > 0.6 ? '#e6c3e6' : '#f7f0f4';
          s += `<path d="M${n1(x - w)},${n1(y + (edge ? h : 0))} Q${n1(x)},${n1(y - h)} ${n1(x + w)},${n1(y + (edge ? h * 1.4 : 0))}" stroke="${c}" stroke-width="${n1(2.5 + r() * 2)}" fill="none" stroke-linecap="round" opacity=".92"/>`;
        }
        return `<g filter="url(#fSoft)">${s}</g>`;
      }
    },

    sauce: {
      vh: 84, top: 6, base: 16,
      draw(r) {
        const drips = [{ x: 76, w: 12, len: 34 }, { x: 168, w: 9, len: 20 }, { x: 262, w: 13, len: 48 }, { x: 372, w: 9, len: 24 }, { x: 468, w: 12, len: 40 }, { x: 540, w: 8, len: 18 }];
        drips.forEach((d) => { d.len *= 0.8 + r() * 0.4; });
        return `
        <path d="M34,12 Q300,-8 566,12${dripEdge(34, 566, 14, 14, drips)}Z" fill="url(#gSauce)"/>
        <path d="M60,10 Q300,-4 540,10" stroke="#ffd2ad" stroke-opacity=".6" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        ${drips.map((q) => `<circle cx="${n1(q.x - q.w * 0.25)}" cy="${n1(22 + q.len * 0.8)}" r="${n1(q.w * 0.22)}" fill="#fff" opacity=".5"/>`).join('')}`;
      }
    },

    bacon: {
      vh: 46, top: 10, base: 22,
      draw(r) {
        const strip = (y, ph) => {
          let d = `M-6,${y}`;
          for (let x = -6; x < 612; x += 44) d += ` Q${x + 22},${n1(y + (((x / 44 + ph) % 2) ? -12 : 12))} ${x + 44},${y}`;
          return d;
        };
        return [[16, 0], [26, 1]].map(([y, ph]) => `
          <path d="${strip(y, ph)}" stroke="#5e170c" stroke-width="16" fill="none" stroke-linecap="round"/>
          <path d="${strip(y, ph)}" stroke="#9c2f18" stroke-width="12" fill="none" stroke-linecap="round"/>
          <path d="${strip(y - 2, ph)}" stroke="#efc19a" stroke-width="3" fill="none" opacity=".85"/>`).join('');
      }
    },

    jalapeno: {
      vh: 40, top: 6, base: 16,
      draw(r) {
        let s = '';
        [36, 120, 210, 300, 390, 480, 566].forEach((x) => {
          const y = 12 + (r() - 0.5) * 8;
          s += `<g transform="translate(${x},${n1(y)}) rotate(${n1((r() - 0.5) * 20)})">
            <ellipse rx="22" ry="8.5" fill="#2e6b18"/><ellipse rx="17" ry="6" fill="#a8c95b"/>
            <ellipse rx="7" ry="2.6" fill="#e9efc0"/><circle cx="-5" cy="1" r="1.5" fill="#fffbe0"/><circle cx="4" cy="-1" r="1.5" fill="#fffbe0"/></g>`;
        });
        return s;
      }
    },

    bunTop: {
      vh: 196, top: 0, base: 178,
      draw(r, o) {
        const dark = o.bun === 'charcoal';
        let seeds = '';
        for (let i = 0; i < 54; i++) {
          const x = 300 + (r() * 2 - 1) * 236;
          const nx = (x - 300) / 274;
          const yTop = 8 + 150 * Math.pow(Math.abs(nx), 2.4);
          const y = yTop + 10 + r() * (140 - yTop) * 0.75;
          const s = 1 - Math.abs(nx) * 0.35;
          const rot = nx * 55 + (r() - 0.5) * 50;
          seeds += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(5.6 * s)}" ry="${n1(2.6 * s)}" transform="rotate(${n1(rot)} ${n1(x)} ${n1(y)})" fill="url(#gSeed)" stroke="#8a5a26" stroke-opacity=".35" stroke-width=".6"/>`;
        }
        return `
        <path d="M24,148 C24,54 150,4 300,4 C450,4 576,54 576,148 Q576,168 552,174 Q300,196 48,174 Q24,168 24,148Z" fill="url(#${dark ? 'gBunTopDark' : 'gBunTop'})"/>
        <path d="M26,140 Q300,178 574,140 Q576,168 552,174 Q300,196 48,174 Q24,168 26,140Z" fill="#000" opacity=".28"/>
        ${seeds}
        <ellipse cx="220" cy="52" rx="130" ry="30" fill="#fff" opacity="${dark ? 0.12 : 0.22}" filter="url(#fBlur)"/>
        <ellipse cx="190" cy="44" rx="46" ry="9" fill="#fff" opacity="${dark ? 0.18 : 0.35}" filter="url(#fSoft)"/>`;
      }
    }
  };

  /**
   * build(el, recipe, opts) — recipe is bottom→top list of layer names.
   * opts.spread: extra room (units per gap) reserved for exploding.
   */
  function build(el, recipe, opts) {
    opts = opts || {};
    const spread = opts.spread || 0;
    const r = rng(opts.seed || 7);
    const n = recipe.length;

    // Stack bottom→top.
    let contact = 0;
    const placed = recipe.map((name) => {
      const spec = LAYERS[name];
      const y = contact - spec.base;
      contact = y + spec.top;
      return { name, spec, y };
    });
    const minY = Math.min(...placed.map((p) => p.y));
    const maxY = Math.max(...placed.map((p) => p.y + p.spec.vh));
    const room = spread * (n - 1);
    const pad = 20 + room / 2;
    const H = maxY - minY + pad * 2;

    el.classList.add('burger');
    el.style.aspectRatio = `${W} / ${n1(H)}`;
    el.innerHTML = '';

    const layers = placed.map((p, i) => {
      const y = p.y - minY + pad;
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', `0 0 ${W} ${p.spec.vh}`);
      s.setAttribute('class', 'burger-layer layer-' + p.name);
      s.setAttribute('aria-hidden', 'true');
      s.style.top = (y / H) * 100 + '%';
      s.style.height = (p.spec.vh / H) * 100 + '%';
      s.style.zIndex = String(i + 1);
      s.innerHTML = p.spec.draw(r, opts);
      el.appendChild(s);
      return { el: s, name: p.name, y, spec: p.spec, index: i, off: 0, x: 0, rot: 0 };
    });

    const api = {
      el, layers, H, spread,
      unit: () => el.clientWidth / W,
      /* p: 0 assembled → 1 fully exploded. Layers rise from the bottom, centered. */
      setExplode(p, extra) {
        const u = api.unit();
        const mid = (n - 1) / 2;
        layers.forEach((L, i) => {
          const off = (mid - i) * spread * p;
          const dx = extra && extra.drift ? Math.sin(i * 1.7) * extra.drift * p : 0;
          const rot = extra && extra.rot ? Math.sin(i * 2.3) * extra.rot * p : 0;
          L.off = off;
          L.el.style.transform = `translate3d(${n1(dx * u)}px,${n1(off * u)}px,0) rotate(${n1(rot)}deg)`;
        });
      },
      // Center of a layer (units, relative to el top) at current explode.
      layerCenter(i) {
        const L = layers[i];
        return L.y + (L.spec.top + L.spec.base) / 2 + L.off;
      }
    };
    return api;
  }

  window.Burger = { build, rng };
})();
