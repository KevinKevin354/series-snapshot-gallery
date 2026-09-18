/**
 * Eigener Build für die Einzel-Datei-Variante: erzeugt dist-single/foto-galerie.html,
 * die per Doppelklick in Chrome/Edge geöffnet werden kann (kein Server nötig).
 * Start mit: npm run build:single
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: ".",
  base: "./",
  plugins: [react(), tailwindcss(), tsconfigPaths(), viteSingleFile()],
  build: {
    outDir: "dist-single",
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      input: "single.html",
      output: { entryFileNames: "app.js" },
    },
  },
});
