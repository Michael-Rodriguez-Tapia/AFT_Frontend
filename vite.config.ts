import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist", // 👈 asegura que la salida quede en /dist (usada por Nginx)
    emptyOutDir: true,
  },
});
