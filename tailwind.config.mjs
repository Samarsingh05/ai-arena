/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"]
      },
      colors: {
        arena: {
          bg: "#05060a",
          card: "#0b0c10",
          border: "#1c1f26",
          accent: "#3b82f6"
        }
      }
    }
  },
  plugins: []
}

export default config
