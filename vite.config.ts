import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { assetTunerPlugin } from "./vite-plugin-asset-tuner";

export default defineConfig({
  plugins: [react(), assetTunerPlugin()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three-vendor";
        },
      },
    },
  },
});
