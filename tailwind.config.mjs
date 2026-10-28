/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#08090A',
        surface: {
          DEFAULT: '#0C0D0E',
          card: '#0F1012',
          elevated: '#141517',
          subtle: '#181A1D',
        },
        foreground: {
          DEFAULT: '#EDEDED',
          secondary: '#A0A6AD',
          muted: '#8A8F98',
        },
        accent: {
          DEFAULT: '#D0D6E0',
          success: '#22C55E',
          warning: '#F59E0B',
          fault: '#F87171',
        },
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
