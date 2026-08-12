/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: {
          night: '#0B1210',
          surface: '#131F1A',
          surface2: '#182A22',
          line: '#24352C',
        },
        chalk: '#EDEFE9',
        floodlight: {
          DEFAULT: '#E8A33D',
          dim: '#B8802E',
        },
        live: {
          DEFAULT: '#3FA34D',
          dim: '#2C7A38',
        },
        slate: {
          muted: '#5C6B64',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'pitch-lines': 'radial-gradient(circle at 50% 0%, rgba(63,163,77,0.06) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}
