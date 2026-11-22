import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Hosted at cleanandcaremotera.github.io — a repo named exactly
// "<account>.github.io" serves at the account's root, not a /<repo>/
// subpath, so base is "/" in both dev and production.
export default defineConfig(() => ({
  base: "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
}));
