import { defineConfig } from 'tsup'

export default defineConfig({
  entryPoints: [
    'src/index.ts',
    'src/spy.ts',
    'src/spyOn.ts',
    'src/restoreAll.ts',
  ],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  tsconfig: './tsconfig.json',
  target: 'es2017',
  splitting: false,
  clean: true,
  dts: true,
})
