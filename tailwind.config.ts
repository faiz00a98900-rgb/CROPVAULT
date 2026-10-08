import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm agricultural neutral palette
        base: {
          DEFAULT: "#E9E4D8", // neumorphic surface
          soft: "#F1EDE3",
          deep: "#DDD6C6",
        },
        ink: {
          DEFAULT: "#2E3A2F", // deep green-gray text
          soft: "#5C6B5D",
          faint: "#8A968A",
        },
        leaf: {
          DEFAULT: "#2F6B3B", // primary deep green
          dark: "#1E4A28", // forest green for important actions
          light: "#4C8A58",
        },
        amber: {
          DEFAULT: "#C68A20", // muted amber warnings
          soft: "#E0A94A",
        },
        chili: {
          DEFAULT: "#C4452F", // critical red
        },
        sky: {
          DEFAULT: "#3A6EA5", // informational blue / movement
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.35rem",
      },
      boxShadow: {
        neu: "8px 8px 18px rgba(163,153,128,0.55), -8px -8px 18px rgba(255,255,255,0.85)",
        "neu-sm":
          "5px 5px 10px rgba(163,153,128,0.5), -5px -5px 10px rgba(255,255,255,0.8)",
        "neu-xs":
          "3px 3px 6px rgba(163,153,128,0.45), -3px -3px 6px rgba(255,255,255,0.8)",
        inset:
          "inset 5px 5px 10px rgba(163,153,128,0.5), inset -5px -5px 10px rgba(255,255,255,0.85)",
        "inset-sm":
          "inset 3px 3px 6px rgba(163,153,128,0.45), inset -3px -3px 6px rgba(255,255,255,0.85)",
        pressed:
          "inset 6px 6px 12px rgba(163,153,128,0.55), inset -6px -6px 12px rgba(255,255,255,0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
