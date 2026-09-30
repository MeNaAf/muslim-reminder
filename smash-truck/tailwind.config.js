/** Rebuild: npx tailwindcss@3 -i css/tailwind.src.css -o css/tailwind.css --minify */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: { ink: '#0a0908', coal: '#141210', ember: '#ff5a1f', melt: '#ffb321', cream: '#f4ead8', smoke: '#8d857b' },
      fontFamily: { display: ['Anton', 'Impact', 'sans-serif'], sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] }
    }
  }
};
