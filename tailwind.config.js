/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        frame: 'var(--frame)',
        soft: 'var(--soft)',
        emerald: 'var(--emerald)',
        brand: 'var(--brand)',
        tool: 'var(--tool)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        line: 'var(--line)',
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Hanken Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        hand: ['Shantell Sans', 'ui-rounded', 'cursive'],
      },
      screens: {
        xs: '400px',
      },
    },
  },
  plugins: [],
};
