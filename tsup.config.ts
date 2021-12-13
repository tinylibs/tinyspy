import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  tsconfig: './tsconfig.json',
  target: 'es2017',
  splitting: false,
  clean: true,
  dts: true,
})
