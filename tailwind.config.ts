import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#fff7ed",
        cream: "#f8ead7",
        tomato: "#ff6f61",
        cobalt: "#3567ff",
        lemon: "#ffe06a",
        mint: "#9ee8c6",
        raspberry: "#f05b93",
        lavender: "#d8c5ff",
        sky: "#b8ecff",
        peach: "#ffd4c7",
        pistachio: "#dff7b5",
      },
      fontFamily: {
        display: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        sticker: "8px 10px 0 rgba(21,21,21,0.16)",
        soft: "0 24px 80px rgba(21,21,21,0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
