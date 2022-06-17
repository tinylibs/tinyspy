import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  tsconfig: './tsconfig.json',
  target: 'node14',
  minify: false,
  clean: true,
  dts: true,
})
