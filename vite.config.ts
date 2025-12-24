import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lsz.ts',
      name: 'Lsz',
      fileName: (format) => `lsz.${format}.js`,
      formats: ['umd']
    },
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {}
      }
    }
  }
});