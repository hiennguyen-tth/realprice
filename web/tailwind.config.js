/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF5A1F",
          light: "#FF7A47",
          dark: "#E04A15",
          50: "#FFF3EE",
          100: "#FFE4D5",
          200: "#FFC9AC",
          300: "#FFA882",
          400: "#FF7A47",
          500: "#FF5A1F",
          600: "#E04A15",
          700: "#B83910",
          800: "#8F2B0C",
          900: "#6B1F08",
        },
        heat: {
          1: "#22c55e",
          2: "#84cc16",
          3: "#eab308",
          4: "#f97316",
          5: "#ef4444",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F8F9FA",
          tertiary: "#F1F3F5",
        },
        border: {
          DEFAULT: "#E5E7EB",
          subtle: "#F3F4F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "Be Vietnam Pro", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0,0,0,0.08)",
        "card-hover": "0 8px 24px 0 rgba(0,0,0,0.12)",
        panel: "0 4px 20px 0 rgba(0,0,0,0.10)",
        bubble: "0 2px 12px 0 rgba(255,90,31,0.30)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      screens: {
        xs: "480px",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
