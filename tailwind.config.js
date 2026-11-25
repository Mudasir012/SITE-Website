/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Decent Collegiate Blue Theme
        navy: {
          950: '#07101E',
          900: '#0B1B33', // Core background canvas
          850: '#0E2342', // Secondary section background
          800: '#132B50', // Card surface
          750: '#173460', // Card hover / interactive surface
          700: '#1E4177', // Borders
          600: '#255296', // Secondary borders / divider
          500: '#2B7FFF', // Vibrant collegiate royal blue
          400: '#5498FF',
          300: '#8CBDFF',
          200: '#BCD8FF',
          100: '#E0EEFF',
          50: '#F0F6FF',
        },
        sand: {
          50: '#FCFBF8',
          100: '#F7F3EB',
          200: '#EFE7D6',
          300: '#E5D6BA',
          400: '#D9C299',
          500: '#CCA976', // Warm collegiate gold / cream
          600: '#B89052',
          700: '#947038',
        },
        ivory: {
          DEFAULT: '#F8FAFC',
          muted: '#94A3B8',
          subtle: '#8A96A8',
        },
        // Sampled from the CITE emblem: blue / yellow / green / red
        cite: {
          blue: '#0041B3',
          deep: '#002C74',
          darker: '#001B48',
          yellow: '#FCBF04',
          green: '#027E35',
          red: '#E40206',
        },
        // Home page world: black stage, white type, CITE red + gold + green accents.
        arcade: {
          ink: '#050505',
          coal: '#121212',
          bone: '#FFFFFF',
          mute: '#A3A3A3',
          violet: '#E40206',
          lime: '#FCBF04',
          limeHot: '#027E35',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        handwriting: ['Caveat', 'cursive'],
      },
      maxWidth: {
        content: '1240px',
      },
    },
  },
  plugins: [],
};
