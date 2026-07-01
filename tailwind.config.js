export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Noto Sans TC", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(125, 211, 252, 0.18), 0 24px 80px rgba(15, 23, 42, 0.34)",
      },
    },
  },
  plugins: [],
};
