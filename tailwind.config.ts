import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Figma: Adamson navy
        brand: {
          50: "#EEF2FA",
          100: "#D8E0F2",
          200: "#B0C0E3",
          300: "#7F96CC",
          400: "#4B67AE",
          500: "#23408F",
          600: "#0D2A6E",
          700: "#0A2463",
          800: "#081C4F",
          900: "#06153B",
        },
        // Figma: teal accent (active nav, course chips, secondary CTA)
        teal: {
          50: "#E9F7F7",
          100: "#CDEEEE",
          200: "#9BDCDD",
          300: "#5FC3C5",
          500: "#139AA0",
          600: "#0E8A8E",
          700: "#0B6F72",
        },
        paper: "#F7F9FC",
        ink: "#0F1B3D",
        muted: "#64708A",
        line: "#E3E8F0",
      },
    },
  },
  plugins: [],
};
export default config;
