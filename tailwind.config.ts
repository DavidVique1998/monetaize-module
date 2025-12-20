import type { Config } from "tailwindcss";

const config: Config & { safelist?: string[] } = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-success',
    'bg-success/90',
    'text-success-foreground',
    'bg-info',
    'bg-info/90',
    'text-info-foreground',
    'bg-error',
    'bg-error/90',
    'text-error-foreground',
    'bg-warning',
    'bg-warning/90',
    'text-warning-foreground',
    'bg-destructive',
    'bg-destructive/90',
    'text-destructive-foreground',
    'bg-secondary',
    'bg-secondary/80',
    'text-secondary-foreground',
    'bg-light',
    'bg-light/90',
    'text-light-foreground',
    'bg-dark',
    'bg-dark/90',
    'text-dark-foreground',
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
          light: "var(--destructive-light)",
          dark: "var(--destructive-dark)",
          border: "var(--destructive-border)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
        },
        error: {
          DEFAULT: "var(--error)",
          foreground: "var(--error-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        light: {
          DEFAULT: "var(--light)",
          foreground: "var(--light-foreground)",
        },
        dark: {
          DEFAULT: "var(--dark)",
          foreground: "var(--dark-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
