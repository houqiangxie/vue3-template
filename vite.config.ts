import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileViewerRenderers } from '@file-viewer/vite-plugin';
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
import { mockApiPlugin } from './mock/plugin';

const root = fileURLToPath(new URL('.', import.meta.url));
const isElectron = process.env.ELECTRON === 'true';

function resolveFlag(value: string | undefined) {
  return value === 'true' || value === '1';
}

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
  // 脚本 cross-env 优先于 .env 文件，便于 npm run dev:mock / dev:api 切换
  const useMock = resolveFlag(process.env.VITE_USE_MOCK ?? env.VITE_USE_MOCK);
  const apiProxyTarget = process.env.VITE_API_PROXY_TARGET
    || env.VITE_API_PROXY_TARGET
    || 'http://127.0.0.1:8080';
  const buildBase = isElectron
    ? (command === 'serve' ? '/' : './')
    : (env.VITE_BUILD_URL ? env.VITE_BUILD_URL.replace(/\/?$/, '/') : '/');
  const devBase = buildBase === '/' ? '' : buildBase.replace(/\/$/, '');
  const isDev = mode === 'dev';

  if (command === 'serve') {
    console.log(`[api] ${useMock ? 'MOCK' : 'PROXY → ' + apiProxyTarget}`);
  }

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
    // 按需复制预览资源，排除 ppt（CJK 字体约 16MB），显著减小 public/vendor
    // 资源路径已含 vendor/ 前缀；勿再设 baseDir: 'vendor'，否则会复制到 public/vendor/vendor
    // 按需复制预览资源，排除 ppt（CJK 字体约 16MB），显著减小 public/vendor
    // 资源路径已含 vendor/ 前缀；勿再设 baseDir: 'vendor'，否则会复制到 public/vendor/vendor
    fileViewerRenderers({
      formats: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv'],
      copyAssets: true,
      chunkStrategy: 'renderer',
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: 'src/components.d.ts',
    }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          'ux-web-storage': ['local', 'session', 'db'],
        },
      ],
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
    plugins.push(
      electron({
        main: {
          entry: 'electron/main.ts',
          vite: {
            plugins: [electronAssetsPlugin()],
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron', 'electron-updater'],
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

  // Mock 开启时由中间件接管 /api，不再走代理
  if (command === 'serve' && useMock) {
    plugins.push(mockApiPlugin('/api'));
  }

  return defineConfig({
    plugins,
    server: {
      open: false,
      cors: true,
      port: 90,
      hmr: { overlay: false },
      host: process.env.VITE_DEV_HOST || '0.0.0.0',
      watch: {
        // Windows EBUSY on large/locked files under public/vendor (fonts, pdf assets)
        ignored: ['**/public/vendor/**'],
      },
      proxy: useMock
        ? undefined
        : {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
              // rewrite: path => path.replace(/^\/api/, ''),
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
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules'))
              return
            if (id.includes('naive-ui'))
              return 'naive-ui'
            if (id.includes('@file-viewer'))
              return 'file-viewer'
            // Electron desktop shell does not ship the App (MPA) entry; skip vant split.
            if (!isElectron && (id.includes('/vant/') || id.includes('\\vant\\')))
              return 'vant'
            if (
              id.includes('/vue/')
              || id.includes('/vue-router/')
              || id.includes('/pinia/')
              || id.includes('\\vue\\')
              || id.includes('\\vue-router\\')
              || id.includes('\\pinia\\')
            ) {
              return 'vue-vendor'
            }
          },
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/scss/variables.scss" as *;`,
        },
      },
    },
  });
};
