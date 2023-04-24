import { defineConfig, loadEnv, UserConfigExport, ConfigEnv, searchForWorkspaceRoot } from 'vite';
import { fileURLToPath, URL } from "node:url";
import vue from '@vitejs/plugin-vue';
import { resolve, join } from "path";
import Components from 'unplugin-vue-components/vite';
import vueJsx from '@vitejs/plugin-vue-jsx';
import {createHtmlPlugin} from "vite-plugin-html";
import viteCompression from 'vite-plugin-compression';
import {NaiveUiResolver,} from "unplugin-vue-components/resolvers";
import AutoImport from 'unplugin-auto-import/vite';
import WindiCSS from 'vite-plugin-windicss';
import Pages from 'vite-plugin-pages'
import ReactivityTransform from "@vue-macros/reactivity-transform/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
// https://vitejs.dev/config/
export default ({ command, mode }: ConfigEnv): UserConfigExport => {
  // 环境变量
  const env = loadEnv(mode, process.cwd());
  // 开发环境判断
  const isDev = mode === 'dev';
  // vite插件
  const plugins = [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => /^micro-app/.test(tag),
        },
      },
    }),
    vueJsx(), //jsx
    ReactivityTransform(),
    Pages({
      dirs: [{ dir: "src/views/web", baseRoute: "/" }],
      importMode: "async",
      moduleId: "~webRoutes",
      extensions: ["vue"],
      extendRoute(route, parent) {
        return {
          ...route,
          meta: { ...(route.meta || {}), auth: false },
        };
      },
    }),
    Pages({
      dirs: [{ dir: "src/views/app", baseRoute: "" }],
      importMode: "async",
      moduleId: "~appRoutes",
      extensions: ["vue"],
      extendRoute(route, parent) {
        return {
          ...route,
          meta: { ...(route.meta || {}), auth: false },
        };
      },
    }),
    /**
     *  注入环境变量到html模板中
     *  如在  .env文件中有环境变量  VITE_APP_APP_TITLE=admin
     *  则在 html模板中  可以这样获取  <%- VITE_APP_APP_TITLE %>
     *  文档：  https://github.com/anncwb/vite-plugin-html
     */
    // createHtmlPlugin({
    //   inject: {
    //     data: {
    //       env: env,
    //     },
    //   },
    //   minify: true,
    // }),
    // elementUi组件自动引入
    Components({
      resolvers: [NaiveUiResolver()],
      dts: "src/components.d.ts",
    }),
    // 自动引入
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
      resolvers: [NaiveUiResolver()],
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
  ];

  if (!isDev) {
    plugins.push(
      // gzip插件，打包压缩代码成gzip  文档： https://github.com/anncwb/vite-plugin-compression
      viteCompression(),
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
      port: 81,
      hmr: { overlay: false },
      host: "0.0.0.0",
      // https: true,
      proxy: {
        "/gateway": {
          target: "http://172.17.30.184:8899/",
          changeOrigin: true, // 是否跨域
          secure: false,
          rewrite: (path) => path.replace(/^\/gateway/, ""),
        },
        "/api": {
          target: "http://uav.szius.com:1985/",
          changeOrigin: true, // 是否跨域
          secure: false,
        },
        "/myResource": {
          target: "http://172.17.30.184:8888",
          changeOrigin: true, // 是否跨域
          secure: false,
        },
        "/rsxt": {
          target: "https://172.17.30.184:8888",
          changeOrigin: true, // 是否跨域
          secure: false,
          rewrite: (path) => path.replace(/^\/rsxt/, ""),
        },
        // "/assets": {
        //   target: "https://172.17.30.184:8888/",
        //   changeOrigin: true, // 是否跨域
        //   secure: false,
        //   // rewrite: (path) => path.replace(/^\/yjdw/, ""),
        // },
      },
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: fileURLToPath(new URL("./src", import.meta.url)),
        },
      ],
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
          app: resolve(__dirname, "app/index.html"),
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
