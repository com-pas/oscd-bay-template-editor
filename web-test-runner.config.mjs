// import { playwrightLauncher } from '@web/test-runner-playwright';
import { polyfill } from '@web/dev-server-polyfill';
import { visualRegressionPlugin } from '@web/test-runner-visual-regression/plugin';
import { playwrightLauncher } from '@web/test-runner-playwright';

const filteredLogs = ['in dev mode', 'scheduled an update'];

const browsers = [
  playwrightLauncher({ product: 'chromium' }),
  playwrightLauncher({ product: 'firefox' }),
];

export default /** @type {import("@web/test-runner").TestRunnerConfig} */ ({
  /** Test files to run */
  files: 'dist/**/*.spec.js',

  /** Setup to handle duplicate custom element registrations */
  testRunnerHtml: testFramework =>
    `<!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300&family=Roboto:wght@300;400;500&display=swap">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        <script type="module">
          // Handle duplicate custom element registrations from multiple packages
          const originalDefine = customElements.define.bind(customElements);
          customElements.define = function (name, constructor, options) {
            const existing = customElements.get(name);
            if (existing) {
              if (existing === constructor) return;
              console.warn(\`Custom element "\${name}" already defined. Skipping redefinition.\`);
              return;
            }
            originalDefine(name, constructor, options);
          };
        </script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>`,

  /** Resolve bare module imports */
  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },

  /** Coverage configuration */
  coverage: true,
  coverageConfig: {
    exclude: ['**/node_modules/**', '**/__wds-outside-root__/**'],
  },

  /** Filter out lit dev mode logs */
  filterBrowserLogs(log) {
    for (const arg of log.args) {
      if (typeof arg === 'string' && filteredLogs.some(l => arg.includes(l))) {
        return false;
      }
    }
    return true;
  },

  /** Compile JS for older browsers. Requires @web/dev-server-esbuild plugin */
  // esbuildTarget: 'auto',

  /** Amount of browsers to run concurrently */
  concurrentBrowsers: 2,

  /** Amount of test files per browser to test concurrently */
  concurrency: 1,

  /** Browsers to run tests on */
  browsers,

  // See documentation for all available options
  plugins: [
    polyfill({
      scopedCustomElementRegistry: true,
    }),
    visualRegressionPlugin({
      update: process.argv.includes('--update-visual-baseline'),
    }),
  ],

  groups: [
    { name: 'visual', files: 'dist/**/*.test.js' },
    { name: 'unit', files: 'dist/**/*.spec.js' },
  ],
});
