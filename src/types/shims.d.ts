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

// 扩展 Vue 组件实例全局属性
import type { Emitter } from 'mitt';
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $emitter: Emitter<Record<string, any>>;
  }
}
