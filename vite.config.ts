import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
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
