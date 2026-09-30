# SMASH TRUCK

Single-page site for a smash burger food truck. Static HTML, no build needed to run it. Open `index.html` or deploy the folder as-is.

- `js/burger.js` generates the procedural SVG burger. Each layer is its own GPU-composited `<svg>`, which is what drives the exploded view, the hero, and every menu card.
- `js/main.js` runs all scroll and hover choreography in a single `requestAnimationFrame` loop. It's vanilla JS with no GSAP.
- `css/tailwind.css` is precompiled. Rebuild it after adding Tailwind classes:
  `npx tailwindcss@3 -i css/tailwind.src.css -o css/tailwind.css --minify`

Menu items, prices, currency (`CURRENCY`) and weekly stops live at the top of `js/main.js`.
