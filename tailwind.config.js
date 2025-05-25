/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'var(--foreground)',
            a: {
              color: 'var(--primary)',
              '&:hover': {
                color: 'var(--primary-hover)',
              },
            },
            code: {
              color: 'var(--foreground)',
              backgroundColor: 'var(--secondary)',
              borderRadius: '0.25rem',
              padding: '0.2rem 0.4rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'var(--secondary)',
              color: 'var(--foreground)',
              borderRadius: '0.5rem',
            },
            h1: {
              color: 'var(--foreground)',
            },
            h2: {
              color: 'var(--foreground)',
            },
            h3: {
              color: 'var(--foreground)',
            },
            h4: {
              color: 'var(--foreground)',
            },
            blockquote: {
              color: 'var(--foreground)',
              borderLeftColor: 'var(--border)',
            },
            strong: {
              color: 'var(--foreground)',
              fontWeight: '600',
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
            },
            th: {
              backgroundColor: 'var(--secondary)',
              color: 'var(--foreground)',
              fontWeight: '600',
              padding: '0.5rem',
              border: '1px solid var(--border)',
            },
            td: {
              padding: '0.5rem',
              border: '1px solid var(--border)',
            },
          },
        },
      },
    },
  },
  plugins: [
    typography,
  ],
}
