import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // cookie de session posé sur path=/api, sameSite=strict : on reste same-origin via le proxy
    proxy: { "/api": "http://localhost:4000" },
  },
});
