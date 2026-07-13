import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas:   'var(--color-canvas)',
        surface1: 'var(--color-surface1)',
        surface2: 'var(--color-surface2)',
        border:   'var(--color-border)',
        primary:  'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        live:     'var(--color-live)',
        voicemail:'var(--color-voicemail)',
        failed:   'var(--color-failed)',
        'muted-outcome': 'var(--color-muted-outcome)',
        text:     'var(--color-text)',
        muted:    'var(--color-muted)',
        transcript:'var(--color-transcript)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
      borderRadius: {
        badge:       'var(--radius-badge)',
        interactive: 'var(--radius-interactive)',
        button:      'var(--radius-button)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
      },
    },
  },
  plugins: [],
};

export default config;
