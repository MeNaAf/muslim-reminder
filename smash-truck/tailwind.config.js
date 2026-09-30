/** Rebuild: npx tailwindcss@3 -i css/tailwind.src.css -o css/tailwind.css --minify */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)', ember: 'rgb(var(--c-ember) / <alpha-value>)', melt: 'rgb(var(--c-melt) / <alpha-value>)',
        cream: 'rgb(var(--c-cream) / <alpha-value>)', smoke: 'rgb(var(--c-smoke) / <alpha-value>)', line: 'rgb(var(--c-line) / <alpha-value>)'
      },
      fontFamily: { display: ['Anton', 'Impact', 'sans-serif'], sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] }
    }
  }
};
