import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cyber-bg": "#0a0a0c",
        "cyber-cyan": "#00f0ff",
        "cyber-purple": "#ff00ff",
      },
      backgroundImage: {
        "cyberGrid": "linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
