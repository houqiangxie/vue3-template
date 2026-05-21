import 'virtual:uno.css';
import '@/styles/transition/index.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router/web';
import emitter from '@/utils/emitter';
import App from './WebApp.vue';
import 'ux-fileviewer/dist/main.css';

async function bootstrap() {
  const app = createApp(App);

  app.config.globalProperties.$emitter = emitter;

  app.use(createPinia());
  app.use(router);

  // 路由准备就绪后再挂载，避免首屏导航守卫未执行完就渲染
  await router.isReady();

  // 让 Naive UI 在 UnoCSS 样式之后注入，防止样式冲突
  // https://www.naiveui.com/en-US/os-theme/docs/style-conflict
  const meta = document.createElement('meta');
  meta.name = 'naive-ui-style';
  document.head.appendChild(meta);

  app.mount('#webApp');
}

bootstrap();
