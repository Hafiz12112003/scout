/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // broadcast palette
        ink: '#06090D',
        panel: '#0D141B',
        panel2: '#121C25',
        edge: '#1E2B36',
        volt: { DEFAULT: '#C8FF3C', dim: '#8FB82A' },
        flare: { DEFAULT: '#FF5A36', dim: '#B8402A' },
        mute: '#6E8091',
        chalk: '#EEF2F5',
        // legacy names, remapped so pages not yet redesigned still look right
        pitch: { night: '#06090D', surface: '#0D141B', surface2: '#121C25', line: '#1E2B36' },
        floodlight: { DEFAULT: '#FFB020', dim: '#B27A14' },
        live: { DEFAULT: '#C8FF3C', dim: '#8FB82A' },
        slate: { muted: '#6E8091' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        ring: {
          '0%': { transform: 'scale(0.6)', opacity: '0.9' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        rise: 'rise 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        ticker: 'ticker 45s linear infinite',
        ring: 'ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
}