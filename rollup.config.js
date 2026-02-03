import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import { terser } from 'rollup-plugin-terser';


export default {
  input: './bay-template-editor.ts',
  output: {
    sourcemap: true,
    format: 'es',
    dir: 'dist',
  },
  external: [
    '@material/mwc-fab',
    /^lit/,
    '@openscd/oscd-api',
    '@openscd/oscd-api/utils.js',
    '@openscd/scl-lib',
    '@omicronenergy/oscd-editor-sld/dist/sld-editor.js'
  ],

  plugins: [
    typescript(),
    nodeResolve(),
    terser({
      output: {
        comments: false
      },
      compress: {
        keep_fnames: true,
      },
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      }
    }),
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
            ]
          },
        ],
      ],
    }),
  ],
};
