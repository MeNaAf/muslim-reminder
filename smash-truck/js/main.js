/* SMASH TRUCK — interactions & scroll choreography (vanilla, one rAF loop). */
(function () {
  'use strict';

  const CURRENCY = 'R';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ================= Art: truck, fries, shake ================= */
  function truckSVG(closed) {
    const bulbs = Array.from({ length: 13 }, (_, i) => {
      const x = 124 + i * 42.5, y = 110 + Math.sin((i / 12) * Math.PI) * 12;
      return `<circle class="t-bulb" style="animation-delay:${(i % 4) * 0.4}s" cx="${x}" cy="${y}" r="4.5" fill="#ffd79a"/><circle cx="${x}" cy="${y}" r="12" fill="#ffb347" opacity=".18"/>`;
    }).join('');
    const shutter = Array.from({ length: 14 }, (_, i) => `<rect x="150" y="${176 + i * 11}" width="460" height="1.5" fill="#000" opacity=".5"/>`).join('');
    const windowInner = closed
      ? `<rect x="150" y="176" width="460" height="154" rx="6" fill="url(#tShutter)"/>${shutter}
         <g class="neon" filter="url(#fNeon)"><text x="380" y="272" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="64" fill="#ff3b2f" letter-spacing="3">SMASH TRUCK</text></g>
         <text x="380" y="310" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="5" fill="#8d857b">CLOSED · SEE YOU TONIGHT</text>`
      : `<g class="t-window"><rect x="150" y="176" width="460" height="154" rx="6" fill="url(#tWindow)"/>
         <rect x="150" y="176" width="460" height="10" fill="#000" opacity=".35"/>
         <g class="t-chef"><circle cx="440" cy="238" r="22" fill="#1a0c06"/><path d="M398,330 Q400,270 440,264 Q480,270 482,330Z" fill="#1a0c06"/><rect x="420" y="208" width="40" height="14" rx="4" fill="#1a0c06"/></g>
         <g class="t-steam"><path d="M250,300 q-10,-20 0,-40 q10,-20 0,-40" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/><path d="M290,300 q-10,-20 0,-40 q10,-20 0,-40" stroke="#fff" stroke-width="4" fill="none" opacity=".25" stroke-linecap="round"/></g>
         <rect x="180" y="300" width="220" height="12" rx="3" fill="#2a1a12"/>
         <g>${[0, 1, 2, 3].map((i) => `<rect x="${180 + i * 34}" y="192" width="24" height="30" fill="#f4ead8" opacity=".85" transform="rotate(${(i % 2 ? 4 : -3)} ${192 + i * 34} 192)"/>`).join('')}</g>
         <circle cx="220" cy="196" r="5" fill="#fff4d0"/><circle cx="540" cy="196" r="5" fill="#fff4d0"/></g>`;
    return `
    <svg viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${closed ? 'The Smash Truck, closed for the night with a glowing neon logo' : 'Side view of the Smash Truck with neon signage and a lit serving window'}">
      <defs>
        <linearGradient id="tBody${closed ? 'c' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23201e"/><stop offset=".6" stop-color="#141211"/><stop offset="1" stop-color="#0a0908"/></linearGradient>
        <linearGradient id="tWindow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a"/><stop offset=".5" stop-color="#ff8a3a"/><stop offset="1" stop-color="#9e2f12"/></linearGradient>
        <linearGradient id="tShutter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1b1a"/><stop offset="1" stop-color="#0e0d0c"/></linearGradient>
        <linearGradient id="tGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3a44"/><stop offset="1" stop-color="#0a1014"/></linearGradient>
        <pattern id="tStripe" width="40" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="#ff5a1f"/><rect x="20" width="20" height="10" fill="#141210"/></pattern>
        <radialGradient id="tRim"><stop offset="0" stop-color="#6b6663"/><stop offset=".6" stop-color="#2a2827"/><stop offset="1" stop-color="#121110"/></radialGradient>
        <radialGradient id="tSpill" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="500" cy="506" rx="470" ry="26" fill="#000" opacity=".75" filter="url(#fBlur)"/>
      ${closed ? '' : '<ellipse cx="380" cy="500" rx="320" ry="46" fill="url(#tSpill)" opacity=".7" filter="url(#fBlur)"/>'}
      <rect x="104" y="66" width="26" height="34" rx="3" fill="#1a1817"/><rect x="100" y="62" width="34" height="8" rx="2" fill="#262321"/>
      <!-- roof sign -->
      <rect x="300" y="72" width="8" height="30" fill="#0b0b0b"/><rect x="552" y="72" width="8" height="30" fill="#0b0b0b"/>
      <rect x="240" y="14" width="380" height="64" rx="10" fill="#0b0a09" stroke="#1f1c1a" stroke-width="2"/>
      <g class="${closed ? 'neon-dead' : 'neon'}" filter="url(#fNeon)">
        <text x="430" y="64" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="46" fill="#ff3b2f" letter-spacing="4">SMASH TRUCK</text>
      </g>
      <!-- body -->
      <rect x="40" y="98" width="780" height="342" rx="26" fill="url(#tBody${closed ? 'c' : ''})"/>
      <path d="M800,190 L894,190 Q934,194 950,244 L972,336 Q978,380 966,420 L964,440 L800,440Z" fill="url(#tBody${closed ? 'c' : ''})"/>
      <path d="M816,206 L890,206 Q918,210 930,250 L944,314 L816,314Z" fill="url(#tGlass)"/>
      <path d="M840,206 L870,206 L826,314 L816,314 L816,262Z" fill="#fff" opacity=".06"/>
      <rect x="954" y="372" width="16" height="20" rx="4" fill="#ffe9b0"/><ellipse cx="990" cy="382" rx="40" ry="18" fill="#ffd27a" opacity=".12"/>
      <rect x="40" y="98" width="780" height="6" rx="3" fill="#fff" opacity=".05"/>
      <rect x="40" y="392" width="930" height="8" fill="#ff5a1f"/>
      <!-- window + awning -->
      <rect x="142" y="168" width="476" height="170" rx="10" fill="#050505"/>
      ${windowInner}
      ${closed ? '' : `<rect x="122" y="134" width="516" height="36" fill="url(#tStripe)"/><rect x="122" y="134" width="516" height="4" fill="#000" opacity=".35"/>
      ${Array.from({ length: 13 }, (_, i) => `<path d="M${122 + i * 39.7},170 a19.85,14 0 0 0 39.7,0Z" fill="${i % 2 ? '#141210' : '#ff5a1f'}"/>`).join('')}
      <path d="M122,172 Q380,200 638,172" stroke="#000" stroke-opacity=".25" stroke-width="10" fill="none"/>
      ${bulbs}`}
      <rect x="132" y="336" width="496" height="16" rx="3" fill="#24201e"/><rect x="132" y="336" width="496" height="3" fill="#fff" opacity=".12"/>
      <!-- menu board -->
      <rect x="656" y="176" width="126" height="160" rx="6" fill="#0d0c0b" stroke="#2a2522"/>
      <text x="719" y="204" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="18" fill="#ffb321">MENU</text>
      ${[0, 1, 2, 3, 4].map((i) => `<rect x="672" y="${220 + i * 22}" width="${60 + (i * 13) % 28}" height="5" rx="2" fill="#f4ead8" opacity=".45"/><rect x="752" y="${220 + i * 22}" width="16" height="5" rx="2" fill="#ffb321" opacity=".7"/>`).join('')}
      <text x="312" y="428" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="4" fill="#8d857b">SMASHED TO ORDER · FLAT TOP 250°C</text>
      <!-- wheels -->
      <path d="M150,440 A70,70 0 0 1 290,440Z" fill="#050505"/><path d="M700,440 A70,70 0 0 1 840,440Z" fill="#050505"/>
      ${[220, 770].map((x) => `<circle cx="${x}" cy="446" r="56" fill="#0b0b0b"/><circle cx="${x}" cy="446" r="56" fill="none" stroke="#1d1c1b" stroke-width="6"/><circle cx="${x}" cy="446" r="28" fill="url(#tRim)"/><circle cx="${x}" cy="446" r="7" fill="#9c9690"/>`).join('')}
    </svg>`;
  }

  function friesSVG() {
    const r = Burger.rng(11);
    let sticks = '';
    for (let i = 0; i < 22; i++) {
      const x = 48 + r() * 104, h = 90 + r() * 70, rot = (r() - 0.5) * 26;
      sticks += `<rect x="${x.toFixed(1)}" y="${(140 - h).toFixed(1)}" width="${(10 + r() * 4).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="url(#gFry)" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} 140)"/>`;
    }
    let salt = '';
    for (let i = 0; i < 26; i++) salt += `<circle cx="${(50 + r() * 100).toFixed(1)}" cy="${(40 + r() * 80).toFixed(1)}" r="1.2" fill="#fff" opacity=".8"/>`;
    return `<svg viewBox="0 0 200 270" role="img" aria-label="Shoestring fries in a black carton">
      ${sticks}${salt}
      <path d="M28,112 L172,112 L156,262 L44,262Z" fill="#0f0e0d"/>
      <path d="M28,112 L172,112 L170,124 L30,124Z" fill="#1e1c1a"/>
      <path d="M40,124 L60,124 L52,262 L44,262Z" fill="#fff" opacity=".05"/>
      <text x="100" y="200" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="30" fill="#ff5a1f" letter-spacing="1">SMASH</text>
      <text x="100" y="222" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="3" fill="#8d857b">DOUBLE FRIED</text>
    </svg>`;
  }

  function shakeSVG() {
    const r = Burger.rng(5);
    let drops = '';
    for (let i = 0; i < 14; i++) drops += `<ellipse cx="${(54 + r() * 72).toFixed(1)}" cy="${(170 + r() * 110).toFixed(1)}" rx="1.6" ry="2.6" fill="#fff" opacity=".45"/>`;
    return `<svg viewBox="0 0 180 330" role="img" aria-label="Burnt vanilla milkshake with a striped straw">
      <g transform="rotate(12 96 60)"><rect x="90" y="-10" width="12" height="150" rx="3" fill="#f4ead8"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="90" y="${-6 + i * 20}" width="12" height="9" fill="#ff5a1f"/>`).join('')}</g>
      <path d="M40,122 Q40,78 90,74 Q140,78 140,122Z" fill="#fffaf0"/>
      <path d="M52,112 Q60,88 90,86 Q118,88 126,104" stroke="#e8dcc6" stroke-width="3" fill="none"/>
      <path d="M30,122 L150,122 L150,132 L30,132Z" fill="#e8e1d6" opacity=".9"/>
      <path d="M34,132 L146,132 L130,312 L50,312Z" fill="url(#gShake)"/>
      <path d="M34,132 L146,132 L144,150 Q120,160 110,146 Q100,170 88,150 Q74,166 64,148 Q52,160 36,150Z" fill="#b9782f" opacity=".7"/>
      <path d="M40,200 L141,200 L135,262 L46,262Z" fill="#0f0e0d"/>
      <text x="90" y="238" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="24" fill="#ff5a1f">SMASH</text>
      <path d="M44,134 L56,134 L62,310 L52,310Z" fill="#fff" opacity=".22"/>
      ${drops}
    </svg>`;
  }

  /* ================= Build burgers ================= */
  const hero = Burger.build($('#heroBurger'), ['bunBottom', 'patty', 'cheese', 'patty', 'cheese', 'pickles', 'onions', 'sauce', 'bunTop'], { seed: 21, spread: 10 });

  const ANATOMY = [
    ['Toasted heel', 'Potato bun, griddled in beef fat. Holds everything above it.'],
    ['Crispy lace', 'Smashed thin at 250°C. The edges fry until they shatter.'],
    ['Cheese pull', 'American cheese, melted under the dome in 30 seconds.'],
    ['Double down', 'The second smash. Twice the crust, same bun.'],
    ['Melt layer', 'More cheese to glue the whole stack together.'],
    ['Pickle snap', 'House-brined dill chips. The acid cuts the fat.'],
    ['Raw bite', 'Paper-thin onion, pressed straight into the beef.'],
    ['Sauce drip', 'Smash sauce: mayo, mustard, pickle brine and one more thing.'],
    ['Golden crown', 'Sesame top, steamed soft and toasted gold.']
  ];
  const anatomy = Burger.build($('#anatomyBurger'), ['bunBottom', 'patty', 'cheese', 'patty', 'cheese', 'pickles', 'onions', 'sauce', 'bunTop'], { seed: 21, spread: 64 });
  const labelsEl = $('#anatomyLabels');
  const labels = ANATOMY.map(([t, d], i) => {
    const el = document.createElement('div');
    el.className = 'a-label ' + (i % 2 ? 'left' : 'right');
    el.innerHTML = `<span class="a-line"></span><div><div class="a-idx">${String(i + 1).padStart(2, '0')}</div><div class="a-title">${t}</div><div class="a-desc">${d}</div></div>`;
    labelsEl.appendChild(el);
    return el;
  });

  const wrapB = Burger.build($('#wrapBurger'), ['bunBottom', 'patty', 'cheese', 'patty', 'cheese', 'pickles', 'sauce', 'bunTop'], { seed: 33 });
  Burger.build($('#trayBurger'), ['bunBottom', 'patty', 'cheese', 'patty', 'cheese', 'pickles', 'sauce', 'bunTop'], { seed: 44 });
  $('#friesArt').innerHTML = friesSVG();
  $('#shakeArt').innerHTML = shakeSVG();
  $('#truckArt').innerHTML = truckSVG(false);
  $('#ctaTruck').innerHTML = truckSVG(true);

  /* ================= Lineup ================= */
  const MENU = [
    { name: 'Classic Smash', recipe: ['bunBottom', 'patty', 'cheese', 'pickles', 'onions', 'sauce', 'bunTop'], price: 89, meta: ['Single', '120g'], desc: 'One patty smashed paper-thin, with American cheese, pickles, onion and smash sauce. This is the burger that started the queue.' },
    { name: 'Double Lace', recipe: ['bunBottom', 'patty', 'cheese', 'patty', 'cheese', 'pickles', 'sauce', 'bunTop'], price: 119, meta: ['Double', '240g'], badge: 'Best seller', desc: 'Two patties and twice the crispy lace. The edges are thin enough to shatter.' },
    { name: 'Cheese Overload', recipe: ['bunBottom', 'patty', 'cheese', 'cheese', 'patty', 'cheese', 'sauce', 'bunTop'], cheese: 'heavy', price: 129, meta: ['Triple cheese', '240g'], desc: 'Three slices of American, melted under the dome until they give up. You will need napkins.' },
    { name: 'Truck Special', recipe: ['bunBottom', 'patty', 'cheese', 'bacon', 'jalapeno', 'patty', 'cheese', 'sauce', 'bunTop'], price: 139, meta: ['Double', 'Spicy'], badge: 'Truck only', desc: 'A double smash with crispy streaky bacon, pickled jalapeños and smoked chilli sauce.' },
    { name: 'Midnight Smash', recipe: ['bunBottom', 'patty', 'cheese', 'onions', 'patty', 'cheese', 'pickles', 'sauce', 'bunTop'], bun: 'charcoal', price: 135, meta: ['Double', 'After 9PM'], badge: 'After dark', desc: 'A charcoal bun, a double smash, jammy onions and black garlic mayo. Served after 9PM only.' }
  ];
  const cardsEl = $('#cards');
  const cardBurgers = MENU.map((m, i) => {
    const c = document.createElement('article');
    c.className = 'card reveal';
    c.style.transitionDelay = (i % 3) * 0.08 + 's';
    c.innerHTML = `
      <span class="card-no">${String(i + 1).padStart(2, '0')}</span>
      ${m.badge ? `<span class="card-badge">${m.badge}</span>` : ''}
      <div class="card-art"><div class="card-burger" role="img" aria-label="${m.name}"></div></div>
      <h3>${m.name}</h3>
      <div class="card-meta">${m.meta.map((x) => `<span>${x}</span>`).join('')}</div>
      <p>${m.desc}</p>
      <div class="card-foot">
        <div class="price"><small>${CURRENCY}</small>${m.price}</div>
        <button class="order-btn" data-cursor="Add" data-i="${i}"><span>Order from the truck</span></button>
      </div>`;
    cardsEl.appendChild(c);
    const b = Burger.build($('.card-burger', c), m.recipe, { seed: 50 + i, spread: 16, bun: m.bun, cheese: m.cheese });
    return { card: c, b, p: 0, target: 0, rx: 0, ry: 0, trx: 0, try: 0 };
  });

  cardBurgers.forEach((o) => {
    const c = o.card;
    c.addEventListener('pointerenter', () => { o.target = 1; });
    c.addEventListener('pointerleave', () => { o.target = 0; o.trx = 0; o.try = 0; });
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%');
      c.style.setProperty('--my', y * 100 + '%');
      if (fine) { o.try = (x - 0.5) * 10; o.trx = (0.5 - y) * 8; }
    });
  });

  /* ================= Bag ================= */
  const bag = { count: 0, total: 0 };
  const bagEl = $('#bag'), toast = $('#toast');
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-shown'), 2400);
  }
  cardsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-btn');
    if (!btn) return;
    const m = MENU[+btn.dataset.i];
    bag.count++; bag.total += m.price;
    // Fly a mini burger into the bag.
    const src = btn.closest('.card').querySelector('.card-burger');
    const sr = src.getBoundingClientRect();
    bagEl.classList.add('is-shown');
    const br = bagEl.getBoundingClientRect();
    const fly = src.cloneNode(true);
    fly.className = 'fly burger';
    fly.style.left = sr.left + sr.width / 2 - 32 + 'px';
    fly.style.top = sr.top + sr.height / 2 - 32 + 'px';
    document.body.appendChild(fly);
    const dx = br.left + 24 - (sr.left + sr.width / 2 - 32), dy = br.top - (sr.top + sr.height / 2 - 32);
    fly.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 160}px) scale(.8) rotate(-20deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(-40deg)`, opacity: 0.2 }
    ], { duration: reduce ? 1 : 850, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => {
      fly.remove();
      $('#bagCount').textContent = bag.count;
      $('#bagTotal').textContent = CURRENCY + bag.total;
      bagEl.classList.remove('bump'); void bagEl.offsetWidth; bagEl.classList.add('bump');
    };
    btn.classList.add('is-added');
    btn.firstElementChild.textContent = 'Added ✓';
    setTimeout(() => { btn.classList.remove('is-added'); btn.firstElementChild.textContent = 'Order from the truck'; }, 1500);
    showToast(`${m.name} is in your bag. We smash it when you get to the window.`);
  });
  bagEl.addEventListener('click', () => scrollToEl($('#find')));

  /* ================= Stops ================= */
  const STOPS = [
    ['MON', 'Closed. Cleaning the flat top', ''],
    ['TUE', 'Warehouse District', '17:30 – 22:00'],
    ['WED', 'Harbour Lot', '17:30 – 22:00'],
    ['THU', 'Night Market', '18:00 – 23:30'],
    ['FRI', 'Night Market', '18:00 – 01:00'],
    ['SAT', 'Stadium Gate B', '12:00 – 01:00'],
    ['SUN', 'The Old Brewery Yard', '12:00 – 20:00']
  ];
  const today = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
  $('#stops').innerHTML = STOPS.map(([d, w, t]) => `<li class="stop${d === today ? ' is-today' : ''}"><span class="d">${d}</span><span class="w">${w}</span><span class="t">${t}</span></li>`).join('');
  $('#findBtn').addEventListener('click', (e) => {
    e.preventDefault();
    const li = $('.stop.is-today') || $('.stop');
    li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash');
    const [d, w, t] = STOPS.find((s) => s[0] === today) || STOPS[0];
    showToast(t ? `Tonight (${d}): ${w}, ${t}. Look for the red neon.` : `${d}: ${w}. We're back tomorrow.`);
  });
  $('#year').textContent = new Date().getFullYear();

  /* ================= Smooth anchor scroll ================= */
  function scrollToEl(el) {
    const y = el.getBoundingClientRect().top + scrollY;
    if (reduce) return scrollTo(0, y);
    const start = scrollY, dist = y - start, dur = clamp(Math.abs(dist) / 3, 600, 1600);
    const t0 = performance.now();
    (function step(now) {
      const t = clamp((now - t0) / dur, 0, 1);
      scrollTo(0, start + dist * ease(t));
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  $$('a[href^="#"]').forEach((a) => {
    if (a.id === 'findBtn') return;
    a.addEventListener('click', (e) => {
      const el = $(a.getAttribute('href'));
      if (!el) return;
      e.preventDefault();
      scrollToEl(el);
    });
  });

  /* ================= Split text, reveals, counters ================= */
  $$('.split').forEach((el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach((ch) => {
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = ch === ' ' ? ' ' : ch;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    $$('.ch', el).forEach((c, i) => { c.style.transitionDelay = 0.25 + i * 0.035 + 's'; });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  function countUp(el) {
    const to = +el.dataset.count, t0 = performance.now(), d = 1600;
    (function step(now) {
      const t = clamp((now - t0) / d, 0, 1);
      el.textContent = Math.round(to * easeOut(t));
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ================= Loader ================= */
  document.body.classList.add('is-loading');
  function start() {
    const t0 = performance.now(), dur = reduce ? 200 : 1500;
    const temp = $('#loaderTemp'), bar = $('#loaderBar');
    (function step(now) {
      const t = clamp((now - t0) / dur, 0, 1);
      temp.textContent = Math.round(20 + 230 * easeOut(t));
      bar.style.width = t * 100 + '%';
      if (t < 1) return requestAnimationFrame(step);
      $('#loader').classList.add('is-done');
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
      setTimeout(() => {
        $$('#hero .split').forEach((s) => s.classList.add('is-in'));
        $$('.reveal').forEach((r) => io.observe(r));
        $$('[data-count]').forEach(countUp);
      }, 250);
      setTimeout(() => $('#loader').remove(), 1400);
    })(t0);
  }
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(start);
  else start();

  /* ================= Cursor & magnetic ================= */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
  const cur = { x: pointer.x, y: pointer.y, rx: pointer.x, ry: pointer.y };
  const cursorEl = $('#cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), cLabel = $('.cursor-label');
  if (fine) document.body.classList.add('has-cursor');
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = e.clientX / innerWidth - 0.5; pointer.ny = e.clientY / innerHeight - 0.5;
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor]');
    cursorEl.classList.toggle('is-hover', !!t);
    cLabel.textContent = t ? t.dataset.cursor : '';
  });

  $$('.magnetic').forEach((el) => {
    if (!fine) return;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ================= Canvases: steam, sparks, bokeh ================= */
  function fitCanvas(c) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = c.getBoundingClientRect();
    c.width = Math.max(1, r.width * dpr); c.height = Math.max(1, r.height * dpr);
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }
  function sprite(size, stops) {
    const s = document.createElement('canvas');
    s.width = s.height = size;
    const g = s.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return s;
  }
  const steamSprite = sprite(128, [[0, 'rgba(255,245,235,.55)'], [0.4, 'rgba(255,240,225,.18)'], [1, 'rgba(255,240,225,0)']]);
  const sparkSprite = sprite(32, [[0, 'rgba(255,240,200,1)'], [0.25, 'rgba(255,170,60,.9)'], [1, 'rgba(255,90,20,0)']]);
  const bokehSprite = sprite(64, [[0, 'rgba(255,150,60,.5)'], [0.6, 'rgba(255,110,40,.12)'], [1, 'rgba(255,90,20,0)']]);

  const steamC = $('#steam'), sparkC = $('#sparks'), bokehC = $('#bokeh');
  let S = fitCanvas(steamC), K = fitCanvas(sparkC), B = fitCanvas(bokehC);
  const puffs = [], sparks = [];
  const bokeh = Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random(), r: 10 + Math.random() * 50, s: 0.1 + Math.random() * 0.4, a: Math.random() * Math.PI * 2, d: 0.2 + Math.random() * 0.8 }));

  function tickCanvases(dt, heroVisible) {
    if (!heroVisible || reduce) return;
    // Steam rises off the top bun.
    const sc = S.ctx; sc.clearRect(0, 0, S.w, S.h);
    if (puffs.length < 34 && Math.random() < 0.35) {
      puffs.push({ x: S.w * (0.36 + Math.random() * 0.28), y: S.h * 0.36, vx: (Math.random() - 0.5) * 0.25, vy: -(0.35 + Math.random() * 0.45), r: 16 + Math.random() * 16, life: 0, max: 180 + Math.random() * 120 });
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life += dt; p.x += (p.vx + Math.sin(p.life * 0.03) * 0.25) * dt; p.y += p.vy * dt; p.r += 0.28 * dt;
      const t = p.life / p.max;
      if (t >= 1) { puffs.splice(i, 1); continue; }
      sc.globalAlpha = Math.sin(t * Math.PI) * 0.22;
      sc.drawImage(steamSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    sc.globalAlpha = 1;

    // Grease sparks pop off the patty edges.
    const kc = K.ctx; kc.clearRect(0, 0, K.w, K.h);
    if (Math.random() < 0.18) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const n = 2 + (Math.random() * 4) | 0;
      for (let j = 0; j < n; j++) sparks.push({ x: K.w * (0.5 + side * (0.29 + Math.random() * 0.04)), y: K.h * (0.6 + Math.random() * 0.06), vx: side * (0.6 + Math.random() * 1.6), vy: -(1.2 + Math.random() * 2.4), life: 0, max: 40 + Math.random() * 40, s: 3 + Math.random() * 6 });
    }
    kc.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life += dt; p.vy += 0.07 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const t = p.life / p.max;
      if (t >= 1) { sparks.splice(i, 1); continue; }
      kc.globalAlpha = 1 - t;
      kc.drawImage(sparkSprite, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
    }
    kc.globalAlpha = 1; kc.globalCompositeOperation = 'source-over';

    // Warm bokeh drifting behind.
    const bc = B.ctx; bc.clearRect(0, 0, B.w, B.h);
    bokeh.forEach((o) => {
      o.a += 0.004 * dt; o.y -= 0.00025 * o.s * dt;
      if (o.y < -0.1) o.y = 1.1;
      const x = (o.x + Math.sin(o.a) * 0.02 - pointer.nx * 0.03 * o.d) * B.w;
      const y = (o.y - pointer.ny * 0.03 * o.d) * B.h;
      bc.globalAlpha = 0.35 + Math.sin(o.a * 2) * 0.2;
      bc.drawImage(bokehSprite, x - o.r, y - o.r, o.r * 2, o.r * 2);
    });
    bc.globalAlpha = 1;
  }

  /* ================= Section geometry ================= */
  const secAnatomy = $('#anatomy'), secTruck = $('#truck'), hTrack = $('#hTrack');
  let geo = {};
  function measure() {
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    geo = {
      vh: innerHeight, vw: innerWidth,
      aTop: top(secAnatomy), aLen: secAnatomy.offsetHeight - innerHeight,
      tTop: top(secTruck), tLen: secTruck.offsetHeight - innerHeight,
      heroH: $('#hero').offsetHeight,
      docH: document.documentElement.scrollHeight - innerHeight
    };
    S = fitCanvas(steamC); K = fitCanvas(sparkC); B = fitCanvas(bokehC);
  }
  addEventListener('resize', () => { measure(); frame(performance.now(), true); });
  addEventListener('load', measure);

  /* ================= Main loop ================= */
  const nav = $('#nav'), heatFill = $('#heatFill'), ticker = $('#ticker');
  const heroTilt = $('#heroTilt'), anatomyTilt = $('#anatomyTilt'), stage = $('#anatomyStage');
  const layerNum = $('#layerNum'), layerName = $('#layerName'), aBar = $('#anatomyBar'), aHint = $('#anatomyHint');
  const wrapStage = $('#wrapStage'), flapL = $('.wrap-flap.left'), flapR = $('.wrap-flap.right'), wrapBurgerEl = $('.wrap-burger'), wrapGlow = $('.wrap-glow');
  const trayItems = $$('.tray-item'), steps = $$('#truckSteps .step');
  const truckPanel = $('.panel-truck'), cityFar = $('.city-far'), cityNear = $('.city-near');
  const find = $('#find');
  const sm = { scroll: scrollY, a: 0, t: 0, tx: 0, ty: 0, hx: 0, hy: 0, breathe: 0, vel: 0, tick: 0 };
  let last = performance.now(), activeLayer = -1, neonDone = false, ctaNeon = false;
  measure();

  function frame(now, force) {
    const dt = force ? 1 : clamp((now - last) / 16.667, 0.2, 3);
    last = now;
    const y = scrollY;
    const k = force || reduce ? 1 : 1 - Math.pow(1 - 0.14, dt);
    sm.vel = lerp(sm.vel, y - sm.scroll, 0.2);
    sm.scroll = lerp(sm.scroll, y, k);

    // Cursor
    cur.x = lerp(cur.x, pointer.x, 0.6); cur.y = lerp(cur.y, pointer.y, 0.6);
    cur.rx = lerp(cur.rx, pointer.x, 0.18); cur.ry = lerp(cur.ry, pointer.y, 0.18);
    dot.style.transform = `translate3d(${cur.x}px,${cur.y}px,0)`;
    ring.style.transform = `translate3d(${cur.rx}px,${cur.ry}px,0)`;

    nav.classList.toggle('is-scrolled', y > 40);
    heatFill.style.transform = `scaleY(${clamp(y / (geo.docH || 1), 0, 1)})`;

    // Ticker drifts, speeding up with scroll velocity.
    sm.tick -= (1.2 + Math.abs(sm.vel) * 0.35) * dt;
    const half = ticker.scrollWidth / 2;
    if (half && -sm.tick > half) sm.tick += half;
    ticker.style.transform = `translate3d(${sm.tick}px,0,0)`;

    // --- Hero: mouse tilt + scroll parallax + breathing layers.
    const heroVisible = y < geo.heroH;
    if (heroVisible || force) {
      sm.hx = lerp(sm.hx, pointer.nx, 0.06); sm.hy = lerp(sm.hy, pointer.ny, 0.06);
      const hp = clamp(y / geo.heroH, 0, 1);
      heroTilt.style.transform = `translate3d(${sm.hx * 24}px, ${hp * -120}px, 0) rotateY(${sm.hx * 14}deg) rotateX(${-sm.hy * 10}deg) scale(${1 - hp * 0.12})`;
      const near = 1 - clamp(Math.hypot(pointer.nx, pointer.ny) * 2.2, 0, 1);
      sm.breathe = lerp(sm.breathe, fine ? near * 0.45 : 0, 0.06);
      hero.setExplode(sm.breathe + Math.sin(now / 900) * 0.08);
    }
    tickCanvases(dt, heroVisible);

    // --- Anatomy: scroll explodes, holds, reassembles.
    const ap = clamp((sm.scroll - geo.aTop) / geo.aLen, 0, 1);
    if ((ap > 0 && ap < 1) || force || Math.abs(sm.a - ap) > 0.0005) {
      sm.a = ap;
      const ex = ease(range(ap, 0.04, 0.42)) * (1 - ease(range(ap, 0.82, 0.98)));
      sm.tx = lerp(sm.tx, pointer.nx, 0.08); sm.ty = lerp(sm.ty, pointer.ny, 0.08);
      anatomy.setExplode(ex, { drift: 26, rot: 4 });
      anatomyTilt.style.transform = `perspective(1400px) rotateY(${sm.tx * 16}deg) rotateX(${-sm.ty * 8}deg) rotate(${(ex - 0.5) * -4}deg)`;
      aBar.style.transform = `scaleX(${ap})`;
      aHint.textContent = ap < 0.4 ? 'Scroll to deconstruct' : ap < 0.82 ? 'Nine layers, one smash' : 'Reassembling…';

      const u = anatomy.unit(), n = labels.length;
      const scan = range(ap, 0.4, 0.8);
      const idx = ap < 0.42 ? Math.min(n - 1, Math.floor(range(ap, 0.04, 0.42) * n)) : Math.min(n - 1, Math.floor(scan * n));
      labels.forEach((el, i) => {
        const show = range(ex, (i / n) * 0.7, (i / n) * 0.7 + 0.3);
        const yPx = anatomy.layerCenter(i) * u;
        const side = i % 2 ? 1 : -1;
        el.style.opacity = show;
        el.style.transform = `translate3d(${(1 - show) * side * 30}px, ${yPx - el.offsetHeight / 2 + (anatomy.el.offsetTop || 0)}px, 0)`;
        el.classList.toggle('is-active', i === idx && ex > 0.5);
      });
      if (idx !== activeLayer) {
        activeLayer = idx;
        layerNum.textContent = String(idx + 1).padStart(2, '0');
        layerName.textContent = ANATOMY[idx][0];
      }
    }

    // --- Truck: pinned horizontal story.
    const tp = clamp((sm.scroll - geo.tTop) / geo.tLen, 0, 1);
    if ((tp > 0 && tp < 1) || force || Math.abs(sm.t - tp) > 0.0005) {
      sm.t = tp;
      const move = ease(range(tp, 0.26, 0.46)) * 0.5 + ease(range(tp, 0.62, 0.82)) * 0.5;
      hTrack.style.transform = `translate3d(${-move * 2 * geo.vw}px,0,0)`;
      const stepI = tp < 0.4 ? 0 : tp < 0.72 ? 1 : 2;
      steps.forEach((s, i) => s.classList.toggle('is-on', i === stepI));

      // Wrap opens, burger rises.
      const w = ease(range(tp, 0.02, 0.24));
      flapL.style.transform = `rotateY(${-w * 104}deg)`;
      flapR.style.transform = `rotateY(${w * 104}deg)`;
      wrapBurgerEl.style.transform = `translate3d(0, ${-w * 34}%, 0) scale(${1 + w * 0.08}) rotate(${-w * 3}deg)`;
      wrapGlow.style.opacity = w;
      wrapB.setExplode(0);
      const wt = range(tp, 0, 0.3);
      wrapStage.style.transform = `rotateY(${sm.tx * 18 * (wt > 0 ? 1 : 0)}deg) rotateX(${8 - w * 8 - sm.ty * 10}deg)`;

      // Tray items drop in.
      trayItems.forEach((el, i) => {
        const q = easeOut(range(tp, 0.34 + i * 0.05, 0.5 + i * 0.05));
        el.style.opacity = q;
        el.style.transform = `translate3d(0, ${(1 - q) * -120}px, 0) rotate(${(1 - q) * (i - 1) * 12}deg)`;
      });

      // City parallax + neon.
      cityFar.style.transform = `translate3d(${(1 - range(tp, 0.62, 1)) * 60}px,0,0)`;
      cityNear.style.transform = `translate3d(${(1 - range(tp, 0.62, 1)) * 140}px,0,0)`;
      if (!neonDone && tp > 0.74) { neonDone = true; truckPanel.classList.add('neon-on'); }
    }

    // --- CTA neon trigger.
    if (!ctaNeon) {
      const r = find.getBoundingClientRect();
      if (r.top < geo.vh * 0.55) { ctaNeon = true; find.classList.add('neon-on'); }
    }

    // --- Cards: hover explode + tilt.
    cardBurgers.forEach((o) => {
      if (Math.abs(o.p - o.target) < 0.001 && Math.abs(o.rx - o.trx) < 0.01 && Math.abs(o.ry - o.try) < 0.01 && !force) return;
      o.p = lerp(o.p, o.target, 0.12);
      o.rx = lerp(o.rx, o.trx, 0.12); o.ry = lerp(o.ry, o.try, 0.12);
      o.b.setExplode(easeOut(o.p), { drift: 6, rot: 2 });
      o.card.style.transform = `perspective(1000px) rotateX(${o.rx}deg) rotateY(${o.ry}deg)`;
    });

    if (!force) requestAnimationFrame(frame);
  }
  frame(performance.now(), true);
  requestAnimationFrame(frame);
})();
