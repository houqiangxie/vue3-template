// 扩展 vue-router RouteMeta
import 'vue-router';
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
    affix?: boolean;
    isRoot?: boolean;
    icon?: any;
    activeMenu?: string;
    keepAlive?: boolean;
    hiddenNavBar?: boolean;
    auth?: boolean;
    /**
     * Permission keys required to access this route.
     * Leave undefined (or empty) to allow all authenticated users.
     * The navigation guard checks that the user holds at least one of these keys.
     * Configure via `routeConfig` in `src/router/web.ts` or `src/router/app.ts`.
     */
    permissions?: string[];
    /** iframe 地址（component 为 iframe 页时） */
    iFrameUrl?: string;
    /** iframe 宿主路由 base path（不含 catch-all），用于 URL 同步 */
    iFrameBasePath?: string;
  }
}

// 扩展全局 window（Naive UI 脱离上下文的 API）
import type { MessageApi, DialogApi, NotificationApi } from 'naive-ui';
declare global {
  interface Window {
    $message: MessageApi;
    $dialog: DialogApi;
    $notification: NotificationApi;
  }
}

declare module '*?raw' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

interface ImportMetaEnv {
  readonly VITE_ENABLE_I18N?: string
  readonly VITE_baseUrl?: string
  readonly VITE_BPM_API_PREFIX?: string
  readonly VITE_WS_URL?: string
  readonly VITE_ALLOW_QUERY_TOKEN?: string
  readonly VITE_LOGIN_AES_KEY?: string
  readonly VITE_LOGIN_AES_IV?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_BUILD_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
