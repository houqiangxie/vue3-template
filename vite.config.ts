import { defineConfig, loadEnv, UserConfigExport, ConfigEnv, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, join } from "path";
import { writeFileSync, existsSync, promises } from "fs";
import Components from 'unplugin-vue-components/vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import html from "vite-plugin-html";
// import legacy from '@vitejs/plugin-legacy'
import viteCompression from 'vite-plugin-compression';
import {NaiveUiResolver,} from "unplugin-vue-components/resolvers";
import AutoImport from 'unplugin-auto-import/vite';
import WindiCSS from 'vite-plugin-windicss';
import ViteImages from 'vite-plugin-vue-images';
import fs from "fs-extra";
const pathResolve = (dir: string): string => resolve(__dirname, '.', dir);

// https://vitejs.dev/config/
export default ({ command, mode }: ConfigEnv): UserConfigExport => {
  // 环境变量
  const env = loadEnv(mode, process.cwd());
  // 开发环境判断
  const isDev = mode === 'dev';
  // vite插件
  const plugins = [
    vue({
      script: {
        refSugar: true, //ref转换
      },
      template: {
        compilerOptions: {
          isCustomElement: (tag) => /^micro-app/.test(tag),
        },
      },
      reactivityTransform: true, //解构保持响应式
    }),
    vueJsx(), //jsx
    /**
     *  注入环境变量到html模板中
     *  如在  .env文件中有环境变量  VITE_APP_APP_TITLE=admin
     *  则在 html模板中  可以这样获取  <%- VITE_APP_APP_TITLE %>
     *  文档：  https://github.com/anncwb/vite-plugin-html
     */
    html({
      inject: {
        data: {
          env: env,
        },
      },
      minify: true,
    }),
    // elementUi组件自动引入
    Components({
      resolvers: [
        NaiveUiResolver(),
      ],
      dts: "src/components.d.ts",
    }),
    // 自动引入
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
      resolvers: [
        NaiveUiResolver(),
      ],
      // 可以选择auto-import.d.ts生成的位置，使用ts建议设置为'src/auto-import.d.ts'
      dts: "src/auto-import.d.ts",
    }),
    WindiCSS(),
    /**
     *  把src/icons 下的所有svg 自动加载到body下，供组件使用
     *  类似于webpack中的svg-sprite-loader
     *  文档：https://github.com/anncwb/vite-plugin-svg-icons
     */
    // viteSvgIcons({
    //   // 指定需要缓存的图标文件夹
    //   iconDirs: [resolve(process.cwd(), 'src/icons')],
    //   // 指定symbolId格式
    //   symbolId: 'icon-[name]'
    // })
    // ViteImages({
    //   // dirs: ['src/assets/moduleImages'], // 指明图片存放目录
    // }),
    (function (options) {
      const packageJsonPath = join(process.cwd(), "package.json");
      const field = "vite";
      return {
        name: "vite-plugin-package-config",
        async config() {
          if (!existsSync(packageJsonPath)) {
            return;
          }

          try {
            const packageJson: Record<string, any> = JSON.parse(
              await promises.readFile(packageJsonPath, "utf-8")
            );
            const extend = packageJson[field];
            if (!extend) {
              return;
            }
            return extend;
          } catch (e) {}
        },
        api: {
          options: {
            packageJsonPath,
            field,
          },
        },
      };
    })() as any,
    (function () {
      return {
        name: "vite-plugin-optimize-persist",
        apply: "serve",
        configureServer(server) {
          
          const vitePluginPackageConfigPlugin = server.config.plugins.find(
            (plugin) => plugin.name === "vite-plugin-package-config"
          );
          const pkgConfig = vitePluginPackageConfigPlugin?.api.options;

          if (!pkgConfig)
            throw new Error(
              '[vite-config-optimize-persist] plugin "vite-plugin-package-config" not found, have you installed it ?'
            );

          const { packageJsonPath, field } = pkgConfig;

          let optimizeDepsMetadata:
            | { optimized: Record<string, string> }
            | undefined = server._ssrExternals;
          const forceIncluded = server.config?.optimizeDeps?.include || [];
          let newDeps: string[] = [];
          let timer: NodeJS.Timeout;

          function update() {
            newDeps = Object.keys(optimizeDepsMetadata?.optimized || {})
            .filter((dep) => !forceIncluded.includes(dep))
            clearTimeout(timer);
            timer = setTimeout(write, 1000);
          }

          async function write() {
            if (!newDeps.length) return;
            const pkg = await fs.readJSON(packageJsonPath);
            pkg[field] = pkg[field] || {};
            const extend = pkg[field];
            extend.optimizeDeps = extend.optimizeDeps || {};
            extend.optimizeDeps.include = Array.from(
              new Set([...(extend.optimizeDeps.include || []), ...newDeps])
            );
            extend.optimizeDeps.include.sort();
            server.watcher.unwatch(packageJsonPath);
            await fs.writeJSON(packageJsonPath, pkg, { spaces: 2 });
            server.watcher.add(packageJsonPath);
          }

          
          Object.defineProperty(server, "_optimizeDepsMetadata", {
            get() {
              return optimizeDepsMetadata;
            },
            set(v) {
              optimizeDepsMetadata = v;
              update();
            },
          });
        },
      };
    })() as any,
  ];

  if (!isDev) {
    plugins.push(
      // gzip插件，打包压缩代码成gzip  文档： https://github.com/anncwb/vite-plugin-compression
      viteCompression(),
      (function () {
        let basePath = "";
        return {
          name: "vite:micro-app",
          apply: "build",
          configResolved(config) {
            basePath = `${config.base}${config.build.assetsDir}/`;
          },
          writeBundle(options, bundle) {
            for (const chunkName in bundle) {
              if (Object.prototype.hasOwnProperty.call(bundle, chunkName)) {
                const chunk = bundle[chunkName];
                if (chunk.fileName && chunk.fileName.endsWith(".js")) {
                  chunk.code = chunk.code.replace(
                    /(from|import\()(\s*['"])(\.\.?\/)/g,
                    (all, $1, $2, $3) => {
                      return all.replace($3, new URL($3, basePath));
                    }
                  );
                  const fullPath = join(options.dir, chunk.fileName);
                  writeFileSync(fullPath, chunk.code);
                }
              }
            }
          },
        };
      })() as any
    );
  }
  return defineConfig({
    // optimizeDeps: {
    //   devScan: true,
    //   include: ["naive-ui/es", "element-plus/es"],
    // },
    plugins,
    server: {
      // 设置代理，根据我们项目实际情况配置
      open: false, // 设置服务启动时是否自动打开浏览器
      cors: true, // 允许跨域
      port: 80,
      hmr: { overlay: false },
      host: "0.0.0.0",
      proxy: {
        "/gateway": {
          target: "http://172.17.30.184:8899/",
          changeOrigin: true, // 是否跨域
          secure: false,
          rewrite: (path) => path.replace(/^\/gateway/, ""),
        },
        "/myResource": {
          target: "http://172.17.30.184:8888",
          changeOrigin: true, // 是否跨域
          secure: false,
        },
      },
    },
    resolve: {
      alias: [{ find: "@", replacement: pathResolve("src") }],
    },
    base: env.VITE_APP_BUILD_URL, // 设置打包路径   base打包环境需要绝对地址，否则打包替换url时候会报错
    build: {
      target: "es2015",
      outDir: env.VITE_APP_outputDir,
      assetsDir: "assets",
      assetsInlineLimit: 2048,
      cssCodeSplit: true,
      // Terser 相对较慢，但大多数情况下构建后的文件体积更小。ESbuild 最小化混淆更快但构建后的文件相对更大。
      minify: isDev ? "esbuild" : "terser",
      terserOptions: {
        compress: {
          // 生产环境去除console
          drop_console: !isDev,
        },
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          // system: resolve(__dirname, 'system/index.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id
                .toString()
                .split("node_modules/")[1]
                .split("/")[0]
                .toString();
            }
          },
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/assets/scss/variables.scss" as *;
          `,
        },
      },
    },
  });
};
