import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  tsconfig: './tsconfig.json',
  target: 'es2018',
  minify: false,
  minifySyntax: true,
  minifyWhitespace: false,
  clean: true,
  dts: true,
})
