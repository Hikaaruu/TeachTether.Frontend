import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: true,
    proxy: {
      "/api": {
        target: "https://localhost:7054",
        secure: false,
      },
      "/hubs": {
        target: "https://localhost:7054",
        secure: false,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
