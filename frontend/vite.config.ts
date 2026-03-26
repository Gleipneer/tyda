import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces (LAN/Tailscale), same idea as uvicorn --host 0.0.0.0
    host: true,
    port: 5173,
    strictPort: true,
    // Tailscale MagicDNS hostnames when not using raw 100.x IP
    allowedHosts: [".ts.net", ".tailscale.net"],
    hmr: { overlay: false, clientPort: 5173 },
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
