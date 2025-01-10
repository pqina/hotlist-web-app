import { resolve } from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const NAME = 'Hotlist';

export default defineConfig({
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        lib: {
            entry: resolve(__dirname, 'src/main.js'),
            name: NAME,
            fileName: NAME.toLowerCase(),
            formats: ['es'],
        },
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) =>
                    assetInfo.name === 'style.css' ? NAME.toLowerCase() + '.css' : assetInfo.name,
            },
        },
    },
    plugins: [svelte()],
});
