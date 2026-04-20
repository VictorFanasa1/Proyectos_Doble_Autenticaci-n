import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index':                         'src/index.ts',
    'adapters/angular/index':        'src/adapters/angular/index.ts',
    'adapters/angular-legacy/index': 'src/adapters/angular-legacy/index.ts',
    'adapters/react/index':          'src/adapters/react/index.ts',
  },
  format: ['cjs', 'esm'],   // genera .js (CommonJS) y .mjs (ESM)
  dts: true,                 // genera los .d.ts para TypeScript
  clean: true,               // limpia dist/ antes de cada build
  splitting: false,
  sourcemap: true,
  external: [
    '@angular/core',
    '@angular/common',
    'react',
  ],
});
