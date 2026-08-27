import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { reactDevtools } from "agent-react-devtools/vite";

export default defineConfig({
  plugins: [reactDevtools(), react(), tailwindcss()],
  test: { environment: "jsdom", setupFiles: "./src/test/setup.ts", css: true },
});
