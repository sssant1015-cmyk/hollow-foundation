/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hollow: {
          bg: 'var(--h-bg)',
          panel: 'var(--h-panel)',
          panel2: 'var(--h-panel2)',
          line: 'var(--h-line)',
        },
        accent: {
          DEFAULT: 'rgb(var(--h-accent-rgb) / <alpha-value>)',
          dim: 'var(--h-accent-dim)',
        },
        good: '#3ddc97',
        warn: '#f5a623',
        bad: '#ff5d5d',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
