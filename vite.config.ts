import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import UnoCSS from 'unocss/vite';
import lightningcss from 'vite-plugin-lightningcss';
import viteCompression from 'vite-plugin-compression';
import electron from 'vite-plugin-electron/simple';
import { defineConfig, loadEnv, type ConfigEnv } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const isElectron = process.env.ELECTRON === 'true';

function copyElectronAssets() {
  const src = resolve(root, 'electron/assets');
  const dest = resolve(root, 'dist-electron/assets');
  if (!existsSync(src)) {
    return;
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

function electronAssetsPlugin() {
  return {
    name: 'copy-electron-assets',
    buildStart() {
      if (isElectron) {
        copyElectronAssets();
      }
    },
  };
}

export default ({ command, mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd());
  const buildBase = isElectron
    ? (command === 'serve' ? '/' : './')
    : (env.VITE_BUILD_URL ? env.VITE_BUILD_URL.replace(/\/?$/, '/') : '/');
  const devBase = buildBase === '/' ? '' : buildBase.replace(/\/$/, '');
  const isDev = mode === 'dev';

  const plugins = [
    {
      name: 'rewrite-middleware',
      configureServer(serve) {
        serve.middlewares.use((req, _res, next) => {
          const url = req.url || '';
          const path = devBase && url.startsWith(devBase) ? url.slice(devBase.length) : url;
          const normalizedPath = path.replace(/^\/+/, '/');
          for (const appName in serve.config.build.rolldownOptions.input) {
            if (normalizedPath.startsWith(`/${appName}/`) || normalizedPath === `/${appName}`) {
              req.url = (appName == 'main' ? '' : devBase) + `/${appName}/`;
              break;
            }
          }
          next();
        });
      },
    },
    {
      name: 'vite-custom-block-plugin',
      transform(code, id) {
        if (/vue&type=route/.test(id)) {
          return `export default {}`;
        }
        if (/vue&type=custom-block/.test(id)) {
          return `export default Comp => {
            Comp.customBlock = ${code}
          }`;
        }
      },
    },
    vue(),
    vueJsx(),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: 'src/components.d.ts',
    }),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [NaiveUiResolver()],
      dts: 'src/auto-import.d.ts',
      dirs: ['src/utils/**', 'src/store/**', 'src/hooks/**'],
    }),
    UnoCSS(),
    lightningcss({
      browserslist: '>= 0.25%',
    }),
  ];

  if (isElectron) {
    plugins.push(electronAssetsPlugin());
    plugins.push(
      electron({
        main: {
          entry: 'electron/main.ts',
          vite: {
            plugins: [electronAssetsPlugin()],
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
              },
            },
          },
        },
        preload: {
          input: 'electron/preload.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron'],
                output: {
                  format: 'cjs',
                  entryFileNames: 'preload.cjs',
                },
              },
            },
          },
        },
      }),
    );
  }

  if (!isDev) {
    plugins.push(
      viteCompression({ deleteOriginFile: false }),
    );
  }

  return defineConfig({
    plugins,
    server: {
      open: false,
      cors: true,
      port: 81,
      hmr: { overlay: false },
      host: '0.0.0.0',
      proxy: {
        '/gateway': {
          target: 'http://172.17.30.184:8899/',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/gateway/, ''),
        },
        '/api': {
          target: 'http://uav.szius.com:1985/',
          changeOrigin: true,
          secure: false,
        },
        '/myResource': {
          target: 'https://172.17.30.184:8888',
          changeOrigin: true,
          secure: false,
        },
        '/rsxt': {
          target: 'https://172.17.30.184:8888',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/rsxt/, ''),
        },
      },
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
      ],
    },
    base: buildBase,
    build: {
      target: 'es2018',
      outDir: env.VITE_outputDir,
      assetsDir: 'assets',
      assetsInlineLimit: 2048,
      cssCodeSplit: true,
      rolldownOptions: {
        input: isElectron
          ? {
              main: resolve(root, 'index.html'),
            }
          : {
              main: resolve(root, 'index.html'),
              app: resolve(root, 'app/index.html'),
            },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/scss/variables.scss" as *;
            @use "@/assets/scss/common.scss" as *;
          `,
        },
      },
    },
  });
};
