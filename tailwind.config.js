/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        ink: { DEFAULT: "#0B1B2B", soft: "#425466", mute: "#6B7C93" },
        brand: { 50: "#ECFBF8", 100: "#CFF5EE", 200: "#9FE9DC", 300: "#62D5C3", 400: "#2DBBA8", 500: "#109E8D", 600: "#0A7F73", 700: "#0B655D", 800: "#0D514C", 900: "#0E4340" },
        sky2: { 50: "#EEF6FF", 100: "#D9EAFF", 500: "#2F7CF6", 600: "#1F63D8", 700: "#1B4FAE" },
        line: "#E3EAF2",
        canvas: "#F5F8FB",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,27,43,.04), 0 4px 16px rgba(11,27,43,.05)",
        lift: "0 12px 40px -12px rgba(11,27,43,.18)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
