import type { Config } from "tailwindcss";

// Colores y tipografía iguales al sitio de marca (solvera-labs.vercel.app).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        muted: "#787878",
        line: "#ececec",
        line2: "#dcdcdc",
        peach: "#fff6ee",
        solar: "#ff6a00",
        solar2: "#ff8a00",
        solar3: "#ffb800",
        ok: "#0f8a4f",
        warn: "#b45309",
        bad: "#d93025",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "Segoe UI", "sans-serif"],
      },
      maxWidth: { wrap: "1180px" },
    },
  },
  plugins: [],
};

export default config;
