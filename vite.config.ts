import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/raphael-christine/",
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ["0e68-77-235-156-243.ngrok-free.app"],
  },
});
