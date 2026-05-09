import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // ToolsLab custom colors
        lab: {
          primary: '#10b981',
          secondary: '#8b5cf6',
          accent: '#f59e0b',
          dark: '#1f2937',
          light: '#f3f4f6',
          success: '#22c55e',
          danger: '#ef4444',
          glass: 'rgba(255,255,255,0.1)',
        },
        // Playground tokens — bound to CSS variables so theme toggle is instant.
        pg: {
          bg:        'var(--pg-bg)',
          'bg-2':    'var(--pg-bg-2)',
          surface:   'var(--pg-surface)',
          'surface-hi': 'var(--pg-surface-hi)',
          border:    'var(--pg-border)',
          'border-hi': 'var(--pg-border-hi)',
          text:      'var(--pg-text)',
          muted:     'var(--pg-muted)',
          dim:       'var(--pg-dim)',
          accent:    'var(--pg-accent)',
          'accent-2':'var(--pg-accent-2)',
          'accent-3':'var(--pg-accent-3)',
          'accent-4':'var(--pg-accent-4)',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'bubble-up': {
          '0%': { transform: 'translateY(100%) scale(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(-100%) scale(1)', opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.5)' },
          '50%': {
            boxShadow:
              '0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(139, 92, 246, 0.6)',
          },
        },
        'shake-beaker': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        'lab-experiment': {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '0.7' },
          '50%': { transform: 'scale(1.05) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '0.7' },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'glow-violet': '0 0 24px rgba(139, 92, 246, 0.15)',
        'glow-amber': '0 0 24px rgba(245, 158, 11, 0.15)',
        'glow-emerald': '0 0 24px rgba(16, 185, 129, 0.10)',
        'card-inset': 'inset 0 1px 0 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'bubble-up': 'bubble-up 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shake-beaker': 'shake-beaker 0.5s ease-in-out',
        'lab-experiment': 'lab-experiment 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      scale: {
        '102': '1.02',
        '105': '1.05',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '6xl': ['68px', { lineHeight: '1.02', letterSpacing: '-0.045em' }],
        '5xl': ['52px', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        '4xl': ['36px', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
      },
      maxWidth: {
        'pg': '1200px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'pg-card':  '12px',
        'pg-panel': '16px',
        'pg-hero':  '20px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'lab-gradient': 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
        'lab-beaker':
          'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%)',
        'lab-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
