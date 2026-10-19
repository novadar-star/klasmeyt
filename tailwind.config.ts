import type { Config } from "tailwindcss";

/**
 * Klasmeyt tokens — see DESIGN.md.
 * brand = Adamson royal blue · pad = yellow-pad paper (accent, sparingly) · ink/paper/line/muted = neutrals
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  future: { hoverOnlyWhenSupported: true }, // hover styles only on devices that can hover
  theme: {
    extend: {
      fontFamily: {
        sans: ["Instrument Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        hand: ["Kalam", "ui-rounded", "cursive"],
      },
      colors: {
        brand: {
          50: "#EFF3FB",
          100: "#DCE5F6",
          200: "#B9CBEC",
          300: "#8AA6DC",
          400: "#5479C4",
          500: "#2C55AD",
          600: "#1D4196", // primary actions — Adamson royal blue
          700: "#173478", // hover / links
          800: "#13295C", // headings
          900: "#0C1A3D", // sidebar
        },
        pad: {
          50: "#FFFBEA",
          100: "#FFF3C4",
          200: "#FBE79A",
          300: "#F4D65F",
          500: "#D9AE1E",
          800: "#5F4A08",
        },
        ink: "#111A2E",
        muted: "#5D6880",
        line: "#E2E7EF",
        paper: "#F6F8FB",
      },
      borderRadius: {
        control: "8px", // buttons, inputs, chips
        panel: "12px", // cards, panels
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        "pop-in": { from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" }, to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" } },
        "pop-out": { from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" }, to: { opacity: "0", transform: "translate(-50%, -49%) scale(0.98)" } },
      },
      animation: {
        "fade-in": "fade-in 200ms ease forwards",
        "fade-out": "fade-out 150ms ease forwards",
        "pop-in": "pop-in 220ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
        "pop-out": "pop-out 150ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;
