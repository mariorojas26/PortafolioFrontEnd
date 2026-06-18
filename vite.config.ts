import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { assetTunerPlugin } from "./vite-plugin-asset-tuner";

export default defineConfig({
  plugins: [react(), assetTunerPlugin()],
});
