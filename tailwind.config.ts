import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Enhanced Color Hunt Palette with more vibrant blues
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
        // Vibrant blue accents for more prominent blue colors
        blue: {
          DEFAULT: "#234C6A",
          light: "#3A6B8E",
          dark: "#1A3A52",
          vibrant: "#2E6A9A",
        },
        // Additional shades for blending
        success: "#10B981 ",
        danger: "#F43F5E",
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
      },
      borderRadius: {
        xl2: "1.25rem",
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
      },
      animation: {
        "scan-line": "scan-line 2.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
