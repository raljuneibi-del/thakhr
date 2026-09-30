import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    target: "es2022",
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 900,
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
} as any);
