/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

/**
 * Modo noche sin reescribir las pantallas existentes.
 *
 * Las clases que ya usa el proyecto (bg-white, text-gray-900, bg-red-50…) apuntan a variables CSS con
 * canales RGB. `:root` guarda la paleta clara de Tailwind; `.dark` guarda la paleta oscura. Cambiar la
 * clase `dark` en <html> repinta toda la interfaz, y la opacidad (`bg-white/80`) sigue funcionando.
 */

// Rampas de neutros: en modo noche se invierte el orden para conservar el contraste entre capas.
const NEUTROS_OSCURO = {
  white: '#121B2D', // superficie de tarjetas, inputs y modales
  50: '#0B1220', // fondo de página (más oscuro que la tarjeta)
  100: '#17223A',
  200: '#26344E',
  300: '#37476A',
  400: '#6A7A98',
  500: '#8D9AB4',
  600: '#A9B4CA',
  700: '#BFC8DA',
  800: '#D5DCE9',
  900: '#EEF2F8',
  950: '#F7F9FC',
}

// Tintes de fondo por matiz (50-300). Las sombras 400+ conservan el valor de Tailwind
// porque se usan como relleno de botones, iconos y barras que ya tienen buen contraste.
const MATICES = ['red', 'green', 'emerald', 'yellow', 'amber', 'orange', 'blue', 'purple', 'rose']
const TINTES_OSCURO = {
  50: { red: '#2B1519', green: '#10261B', emerald: '#0F2621', yellow: '#2A2410', amber: '#2B2110', orange: '#2B1D12', blue: '#101F36', purple: '#221A38', rose: '#2B1520' },
  100: { red: '#3A1A20', green: '#15341F', emerald: '#12332B', yellow: '#38300F', amber: '#392B0F', orange: '#3A2713', blue: '#142A4A', purple: '#2F2350', rose: '#3A1A28' },
  200: { red: '#5A2229', green: '#1E4D2E', emerald: '#1A4A3F', yellow: '#55471A', amber: '#54401A', orange: '#58381C', blue: '#1E3F6E', purple: '#463477', rose: '#5A2238' },
  300: { red: '#7F2A33', green: '#2B6B41', emerald: '#256B5A', yellow: '#7A6624', amber: '#785C24', orange: '#7E5026', blue: '#2C5A9A', purple: '#634AA8', rose: '#7F2A48' },
}
// Color de texto legible sobre superficies oscuras (en claro se usan las sombras 600-900 de Tailwind).
const TEXTO_OSCURO = {
  red: { 500: '#FF8A93', 600: '#FF7A85', 700: '#FF9AA2', 800: '#FFB4BA', 900: '#FFC9CD' },
  green: { 500: '#4ADE80', 600: '#4ADE80', 700: '#6EE7A0', 800: '#9AF0BC', 900: '#BBF7D0' },
  emerald: { 500: '#34D399', 600: '#34D399', 700: '#5EE0B2', 800: '#8EEBC9', 900: '#B5F3DC' },
  yellow: { 500: '#FACC15', 600: '#FACC15', 700: '#FCD94A', 800: '#FDE68A', 900: '#FEF3C7' },
  amber: { 500: '#FBBF24', 600: '#FBBF24', 700: '#FCD34D', 800: '#FDE68A', 900: '#FEF3C7' },
  orange: { 500: '#FB923C', 600: '#FB923C', 700: '#FDBA74', 800: '#FED7AA', 900: '#FFEDD5' },
  blue: { 500: '#60A5FA', 600: '#60A5FA', 700: '#93C5FD', 800: '#BFDBFE', 900: '#DBEAFE' },
  purple: { 500: '#C084FC', 600: '#C084FC', 700: '#D8B4FE', 800: '#E9D5FF', 900: '#F3E8FF' },
  rose: { 500: '#FB7185', 600: '#FB7185', 700: '#FDA4AF', 800: '#FECDD3', 900: '#FFE4E6' },
}

const aCanales = (hex) => {
  const n = hex.replace('#', '')
  return `${parseInt(n.slice(0, 2), 16)} ${parseInt(n.slice(2, 4), 16)} ${parseInt(n.slice(4, 6), 16)}`
}

const claro = { white: colors.white, ...colors.gray }
const variable = (nombre) => `rgb(var(--c-${nombre}) / <alpha-value>)`

// `white` NO se redefine en `colors`: `text-white` sobre botones rojos debe seguir siendo blanco.
// Solo el fondo (`bg-white`, degradados) usa la superficie del tema.
const paletaVariable = {
  gray: Object.fromEntries(Object.keys(colors.gray).map((s) => [s, variable(`gray-${s}`)])),
}
for (const matiz of MATICES) {
  paletaVariable[matiz] = { ...colors[matiz] }
  for (const s of [50, 100, 200, 300]) paletaVariable[matiz][s] = variable(`${matiz}-${s}`)
}
// Rojo institucional de la Universidad de Medellín (botones y acentos).
paletaVariable.red = { ...paletaVariable.red, 600: '#E30613', 700: '#B8050F' }

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Escala tipográfica estándar: cinco niveles. Los doce tamaños que tenía Tailwind se agrupan
    // en título, subtítulo, texto y texto pequeño, así que una pantalla nunca mezcla más de cinco.
    fontSize: {
      xs: ['0.875rem', { lineHeight: '1.25rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      small: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      body: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.25rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      subtitle: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.75rem', { lineHeight: '2.25rem' }],
      '3xl': ['1.75rem', { lineHeight: '2.25rem' }],
      title: ['1.75rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '6xl': ['2.25rem', { lineHeight: '2.5rem' }],
      display: ['2.25rem', { lineHeight: '2.5rem' }],
    },
    extend: {
      fontFamily: {
        sans: ['"Schibsted Grotesk Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundColor: { white: variable('white') },
      gradientColorStops: { white: variable('white') },
      colors: {
        ...paletaVariable,
        // Tokens de marca y de la barra lateral (no cambian entre claro y oscuro: la barra es siempre azul noche).
        marca: { DEFAULT: '#E30613', oscuro: '#B8050F' },
        navy: { 700: '#1D3557', 800: '#142645', 900: '#0F1E36', 950: '#0A1527' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      const base = { '--c-white': aCanales('#FFFFFF') }
      const oscuro = { '--c-white': aCanales(NEUTROS_OSCURO.white) }
      for (const s of Object.keys(colors.gray)) {
        base[`--c-gray-${s}`] = aCanales(claro[s])
        oscuro[`--c-gray-${s}`] = aCanales(NEUTROS_OSCURO[s])
      }
      for (const matiz of MATICES) {
        for (const s of [50, 100, 200, 300]) {
          base[`--c-${matiz}-${s}`] = aCanales(colors[matiz][s])
          oscuro[`--c-${matiz}-${s}`] = aCanales(TINTES_OSCURO[s][matiz])
        }
      }
      const texto = {}
      for (const [matiz, sombras] of Object.entries(TEXTO_OSCURO)) {
        for (const [s, valor] of Object.entries(sombras)) {
          texto[`.dark .text-${matiz}-${s}`] = { color: valor }
          texto[`.dark .hover\\:text-${matiz}-${s}:hover`] = { color: valor }
          texto[`.dark .border-${matiz}-${s}`] = { borderColor: valor }
        }
      }
      addBase({ ':root': base, '.dark': { ...oscuro, 'color-scheme': 'dark' }, ...texto })
    }),
  ],
}
