import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        deep: {
          DEFAULT: "#1B3C53",
          light: "#2A5A75",
          dark: "#0F2838",
        },
        ocean: {
          DEFAULT: "#234C6A",
          light: "#345F82",
          dark: "#163A52",
        },
        steel: {
          DEFAULT: "#456882",
          light: "#5A7A92",
          dark: "#365670",
        },
        mist: {
          DEFAULT: "#E3E3E3",
          soft: "#F0F0F0",
          dim: "#646363",
        },
        blue: {
          DEFAULT: "#234C6A",
          light: "#3A6B8E",
          dark: "#1A3A52",
          vibrant: "#2E6A9A",
        },
        success: "#10B981 ",
        danger: "#F43F5E",
        sky: {
          DEFAULT: "#3B82F6",
          bright: "#60A5FA",
          deep: "#1D4ED8",
          soft: "#DBEAFE",
        },
        sun: {
          DEFAULT: "#FBBF24",
          bright: "#FCD34D",
          deep: "#D97706",
        },
        leaf: {
          DEFAULT: "#22C55E",
          soft: "#DCFCE7",
          deep: "#16A34A",
        },
        coral: {
          DEFAULT: "#F87171",
          soft: "#FEE2E2",
        },
        berry: "#A855F7",
        surface: {
          DEFAULT: "#F8FAFC",
          elevated: "#FFFFFF",
          sunken: "#F1F5F9",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          subtle: "#94A3B8",
          faint: "#CBD5E1",
        },
        outline: {
          DEFAULT: "#E2E8F0",
          strong: "#94A3B8",
        },
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(36, 35, 32, 0.08)",
        "glass-lg": "0 16px 48px 0 rgba(36, 35, 32, 0.12)",
        ring: "0 0 0 1px rgba(63, 108, 99, 0.15)",
        skylearn: "0 8px 24px rgba(15, 23, 42, 0.06)",
        "skylearn-lg": "0 24px 48px rgba(15, 23, 42, 0.12)",
        "skylearn-sky": "0 12px 32px rgba(59, 130, 246, 0.15)",
        "skylearn-sun": "0 0 24px rgba(252, 211, 77, 0.4)",
      },
      borderRadius: {
        xl2: "1.25rem",
        "skylearn-sm": "8px",
        "skylearn-md": "12px",
        "skylearn-lg": "16px",
        "skylearn-xl": "20px",
        "skylearn-2xl": "28px",
        "skylearn-pill": "999px",
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
      },
      animation: {
        "scan-line": "scan-line 2.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "skylearn-shake": "skylearn-shake 240ms ease-in-out 2",
      },
      transitionTimingFunction: {
        "skylearn-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
