// vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "KPathDB",
            fileName: (format) => `kpathdb.${format}.js`,
        },
        rollupOptions: {
            // Externalize dependencies that shouldn't be bundled
            external: ["zod", "react", "react-dom"],
            output: {
                globals: {
                    zod: "zod",
                    react: "react",
                    "react-dom": "react-dom",
                },
            },
            input: {
                main: "./src/index.ts",
            },
        },
    },
    plugins: [dts(), react()],
});
