import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    server: {
        port: 8000
    },
    resolve: {
        alias: {
            react: path.resolve("src/react"),
            "react-dom": path.resolve("src/react-dom"),
            "react-reconciler": path.resolve("src/react-reconciler"),
            "react-dom-bindings": path.resolve("src/react-dom-bindings"),
            scheduler: path.resolve("src/scheduler"),
            shared: path.resolve("src/shared"),
        },
    },
    plugins: [
        react()
    ],
    optimizeDeps: {
        force: true,
    }
});