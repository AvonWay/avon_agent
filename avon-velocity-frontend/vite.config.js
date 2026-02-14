import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        // Generate manifest.json for backend integration
        manifest: true,
        rollupOptions: {
            input: './src/styles/main.css',
        },
        outDir: 'dist',
    },
})
