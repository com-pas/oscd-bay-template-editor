import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import { terser } from 'rollup-plugin-terser';
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  input: 'demo/index.html',
  output: {
    sourcemap: true,
    format: 'esm',
    dir: 'preview',
  },
  plugins: [
    html(),
    {
      name: 'resolve-bay-template-editor-source',
      resolveId(id) {
        if (id === '../dist/bay-template-editor.js') {
          return resolve(__dirname, 'bay-template-editor.ts');
        }
        return null;
      },
    },
    typescript({ outDir: 'preview' }),
    nodeResolve({
      browser: true,
      exportConditions: ['browser', 'development'],
    }),
    terser(),
    importMetaAssets(),
    babel({
      babelHelpers: 'bundled',
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            targets: [
              'last 3 Chrome major versions',
              'last 3 Firefox major versions',
              'last 3 Edge major versions',
              'last 3 Safari major versions',
            ],
          },
        ],
      ],
    }),
  ],
};
