import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: '#111827',
          light: '#1a1b2e',
          lighter: '#1f2937',
        },
        deep: '#0a0b10',
        accent: {
          violet: '#8b5cf6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        jakarta: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-emerald': '0 0 20px 0 rgba(16, 185, 129, 0.15), inset 0 1px 0 0 rgba(16, 185, 129, 0.1)',
        'glow-amber': '0 0 20px 0 rgba(245, 158, 11, 0.15), inset 0 1px 0 0 rgba(245, 158, 11, 0.1)',
        'glow-rose': '0 0 20px 0 rgba(244, 63, 94, 0.15), inset 0 1px 0 0 rgba(244, 63, 94, 0.1)',
        'glow-violet': '0 0 20px 0 rgba(139, 92, 246, 0.15), inset 0 1px 0 0 rgba(139, 92, 246, 0.1)',
        'glow-blue': '0 0 20px 0 rgba(59, 130, 246, 0.15), inset 0 1px 0 0 rgba(59, 130, 246, 0.1)',
      },
    },
  },
  plugins: [],
};
export default config;
