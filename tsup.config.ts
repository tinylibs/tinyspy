import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: ['src/index.ts'],
  external: ['../optional-types.js'],
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
