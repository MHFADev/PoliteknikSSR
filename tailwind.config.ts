import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", /* Aktifkan dark mode via class "dark" di <html> */
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Flip7 Design System Colors
        
        },
        teal: {
          DEFAULT: "var(--color-teal, #2BA8A2)",
          light: "var(--color-teal-light, #3CC4BD)",
          dark: "var(--color-teal-dark, #1E8C86)",
          bg: "var(--color-teal-bg, #E8F6F5)",
        },
        gold: {
          DEFAULT: "var(--color-gold, #FFD23F)",
          light: "var(--color-gold-light, #FFE47A)",
          dark: "var(--color-gold-dark, #E6B800)",
        },
        flip7: {
          coral: {
            DEFAULT: "var(--color-flip7-coral, #EF6C4A)",
            light: "var(--color-flip7-coral-light, #FF8A6A)",
            dark: "var(--color-flip7-coral-dark, #e73f15)",
          },
          cream: "var(--color-flip7-cream, #FFF8E7)",
        },
        deep: {
          DEFAULT: "var(--color-deep, #1B3C53)",
          light: "var(--color-deep-light, #2A5A75)",
          dark: "var(--color-deep-dark, #0F2838)",
        },
        ocean: {
          DEFAULT: "var(--color-ocean, #3572EF)",
          light: "var(--color-ocean-light, #3ABEF9)",
          dark: "var(--color-ocean-dark, #050C9C)",
        },
        steel: {
          DEFAULT: "var(--color-steel, #456882)",
          light: "var(--color-steel-light, #5A7A92)",
          dark: "var(--color-steel-dark, #365670)",
        },
        mist: {
          DEFAULT: "var(--color-mist, #E3E3E3)",
          soft: "var(--color-mist-soft, #F0F0F0)",
          dim: "var(--color-mist-dim, #64748B)",
          ell: "var(--color-mist-ell, #475569)",
        },
        blue: {
          DEFAULT: "var(--color-blue, #234C6A)",
          light: "var(--color-blue-light, #3A6B8E)",
          dark: "var(--color-blue-dark, #1A3A52)",
          vibrant: "var(--color-blue-vibrant, #2E6A9A)",
        },
        sky: {
          DEFAULT: "var(--color-sky, #3B82F6)",
          bright: "var(--color-sky-bright, #60A5FA)",
          deep: "var(--color-sky-deep, #1D4ED8)",
          soft: "var(--color-sky-soft, #DBEAFE)",
        },
        sun: {
          DEFAULT: "var(--color-sun, #FBBF24)",
          bright: "var(--color-sun-bright, #FCD34D)",
          deep: "var(--color-sun-deep, #D97706)",
        },
        leaf: {
          DEFAULT: "var(--color-leaf, #22C55E)",
          soft: "var(--color-leaf-soft, #DCFCE7)",
          deep: "var(--color-leaf-deep, #16A34A)",
        },
        coral1: {
          DEFAULT: "var(--color-coral1, #F87171)",
          soft: "var(--color-coral1-soft, #FEE2E2)",
        },
        berry: "var(--color-berry, #A855F7)",
        surface: {
          DEFAULT: "var(--color-surface, #F8FAFC)",
          elevated: "var(--color-surface-elevated, #FFFFFF)",
          sunken: "var(--color-surface-sunken, #F1F5F9)",
        },
        ink: {
          DEFAULT: "var(--color-ink, #0F172A)",
          muted: "var(--color-ink-muted, #475569)",
          subtle: "var(--color-ink-subtle, #94A3B8)",
          faint: "var(--color-ink-faint, #CBD5E1)",
        },
        outline: {
          DEFAULT: "var(--color-outline, #E2E8F0)",
          strong: "var(--color-outline-strong, #94A3B8)",
        },
        success: "var(--color-success, #10B981)",
        danger: "var(--color-danger, #F43F5E)",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        josefin: ["var(--font-josefin)", "sans-serif"],
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(36,35,32,0.08)",
        "glass-lg": "0 16px 48px 0 rgba(36,35,32,0.12)",
        ring: "0 0 0 1px rgba(63,108,99,0.15)",
        skylearn: "0 8px 24px rgba(15,23,42,0.06)",
        "skylearn-lg": "0 24px 48px rgba(15,23,42,0.12)",
        "skylearn-sky": "0 12px 32px rgba(59,130,246,0.15)",
        "skylearn-sun": "0 0 24px rgba(252,211,77,0.4)",
        "flip7-sm": "0 2px 8px rgba(0,0,0,0.08)",
        "flip7-md": "0 4px 16px rgba(0,0,0,0.12)",
        "flip7-lg": "0 8px 32px rgba(0,0,0,0.16)",
        "flip7-card": "0 4px 20px rgba(43,168,162,0.1)",
        "flip7-coral-glow": "0 4px 20px rgba(239,108,74,0.35)",
        "flip7-teal-glow": "0 4px 20px rgba(43,168,162,0.3)",
        "flip7-gold-glow": "0 4px 20px rgba(255,210,63,0.4)",
        "flip7-sky-glow": "0 4px 16px rgba(93,173,226,0.3)",
        "flip7-focus": "0 0 0 4px rgba(43,168,162,0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
        "skylearn-sm": "8px",
        "skylearn-md": "12px",
        "skylearn-lg": "16px",
        "skylearn-xl": "20px",
        "skylearn-2xl": "28px",
        "skylearn-pill": "999px",
        "flip7-sm": "8px",
        "flip7-md": "16px",
        "flip7-lg": "24px",
        "flip7-xl": "32px",
        "flip7-pill": "999px",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(0%)" },
          "50%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "skylearn-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "flip7-crown-bounce": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-4px) rotate(-2deg)" },
          "50%": { transform: "translateY(0) rotate(0deg)" },
          "75%": { transform: "translateY(-2px) rotate(2deg)" },
        },
        "flip7-glow-pulse": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.03)" },
        },
        "flip7-boom-pulse": {
          "0%, 100%": { boxShadow: "0 4px 20px rgba(239,108,74,0.35)" },
          "50%": { boxShadow: "0 4px 32px rgba(239,108,74,0.5)" },
        },
        "confetti-fall-1": {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateY(100vh) rotate(720deg)",
            opacity: "0",
          },
        },
        "confetti-fall-2": {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateY(100vh) rotate(-720deg)",
            opacity: "0",
          },
        },
        "confetti-fall-3": {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "100%": {
            transform: "translateY(100vh) rotate(540deg)",
            opacity: "0",
          },
        },
      },
      animation: {
        "scan-line": "scan-line 2.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
        "skylearn-shake": "skylearn-shake 240ms ease-in-out 2",
        "flip7-crown-bounce": "flip7-crown-bounce 1.5s ease-in-out infinite",
        "flip7-glow-pulse": "flip7-glow-pulse 2s ease-in-out infinite",
        "flip7-boom-pulse": "flip7-boom-pulse 2s ease-in-out infinite",
        "confetti-1": "confetti-fall-1 3.2s ease-in forwards",
        "confetti-2": "confetti-fall-2 4s ease-in forwards",
        "confetti-3": "confetti-fall-3 4.5s ease-in forwards",
      },
      transitionTimingFunction: {
        "skylearn-spring": "cubic-bezier(0.34,1.56,0.64,1)",
        "flip7-bounce": "cubic-bezier(0.68,-0.55,0.265,1.55)",
      },
    },
  },
  plugins: [],
};

export default config;
