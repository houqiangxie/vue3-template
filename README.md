# Vue3 Template

基于 Vue 3 + Vite + Naive UI 的中后台前端模板，支持 **Web 管理端**、**App 端（MPA）** 与 **Electron 桌面端**。内置动态路由/权限、CRUD 组合式封装、iframe 嵌入同步，以及可切换的本地 Mock。

## 技术栈


| 类别  | 选型                                                 |
| --- | -------------------------------------------------- |
| 框架  | Vue 3、Vue Router、Pinia                             |
| 构建  | Vite 8、TypeScript、UnoCSS、Sass                      |
| UI  | Naive UI（Web）、Vant（App）                            |
| 桌面  | Electron + electron-updater                        |
| 其它  | unplugin-auto-import / components、file-viewer、vue-i18n（可选） |


## 快速开始

```bash
# 需要 Node.js 18+，推荐 pnpm
pnpm install

# 开发（默认读 .env.dev，当前为本地 Mock）
pnpm dev

# 浏览器访问
# Web：http://localhost:88/
# App：http://localhost:88/app/
```

Mock 模式下任意账号密码均可登录；`admin` 拥有全部权限。

### 对接真实后端

```bash
# 临时关闭 Mock，代理到真实接口
pnpm dev:api

# 或在 .env.dev / .env.dev.local 中设置
# VITE_USE_MOCK=false
# VITE_API_PROXY_TARGET=http://127.0.0.1:8080
```

登录 AES（可选，须与后端一致，16 字节）请放在本地覆盖文件，勿提交：

```bash
cp .env.example .env.dev.local
# 编辑 VITE_LOGIN_AES_KEY / VITE_LOGIN_AES_IV
```



## 常用脚本


| 命令                                             | 说明                            |
| ---------------------------------------------- | ----------------------------- |
| `pnpm dev`                                     | 开发服务（遵循 `.env.dev` 的 Mock 开关） |
| `pnpm dev:mock`                                | 强制本地 Mock                     |
| `pnpm dev:api`                                 | 强制代理真实接口                      |
| `pnpm dev:electron`                            | Electron 开发模式                 |
| `pnpm dev:i18n`                                | 开发并启用 vue-i18n 业务文案          |
| `pnpm build` / `pnpm prod` / `pnpm build:test` | 按 mode 构建 Web                 |
| `pnpm build:electron`                          | 构建并打包桌面端                      |
| `pnpm typecheck`                               | `vue-tsc --noEmit`            |
| `pnpm lint`                                    | ESLint                        |




## 项目结构

```
├── app/index.html          # App 端入口
├── index.html              # Web 端入口
├── electron/               # Electron 主进程 / preload / 托盘 / 更新
├── mock/                   # 本地 Mock（Vite 中间件）
├── public/
│   ├── iframe-bridge.js    # 跨域/第三方子应用可自行引入的桥接脚本
│   └── vendor/             # 文件预览等静态资源
├── src/
│   ├── api/system/         # 系统管理 API
│   ├── components/common/  # CommonForm / SearchPanel / table / modal
│   ├── config/             # 站点与菜单配置
│   ├── hooks/              # usePageList / useCrud / useIframeHost|Child …
│   ├── layout/             # Web 布局（侧栏、TagsView、主题）
│   ├── pages/              # 多入口启动（web.ts / app.ts）
│   ├── router/             # 路由 + 动态路由 / 权限守卫
│   ├── store/              # Pinia（含 iframe 面包屑覆盖）
│   ├── utils/iframeBridge/ # postMessage 协议与路径工具
│   └── views/              # web / app 页面（含 common/IFrame.vue）
└── vite.config.ts
```



## 核心能力



### 双端 MPA

- Web：`index.html` → `src/pages/web.ts`，Naive UI + 后台布局（`layout/index.vue` + 项目配置）
- App：`app/index.html` → `src/pages/app.ts`，仅作 H5 预留（`layout/AppLayout.vue` 轻量壳，不兼容后台布局配置）
- 公共启动逻辑在 `src/pages/createBootstrap.ts`



### 动态路由与权限

登录后请求菜单，经 `buildDynamicRoutes` 生成路由并挂到布局下；侧栏由权限 Store 驱动。未登录跳转 `/login`。

### CRUD 约定

系统管理页推荐组合：

1. `SearchPanel` + 统一 `fields` 配置
2. `CommonTable`（分页、多选、列设置）
3. `usePageList` / `useCrud` / `useFormModal` / `useConfirm`

示例目录：`src/views/web/System/`。

### Mock

- 实现：`mock/plugin.ts` + `mock/handlers/*`
- 开发且 `VITE_USE_MOCK=true` 时挂载到 `/api`
- 启动日志会打印 `[api] MOCK` 或 `[api] PROXY → …`

### iframe 嵌入与路由同步

主应用可通过菜单挂载 iframe 页，与子应用用统一 `postMessage` 协议同步路由、高度、面包屑与登录态。

**能力**

| 能力 | 说明 |
| --- | --- |
| 路由双向同步 | 子 → `route-change` 改主应用 URL；主 → `navigate` 推子应用；keep-alive 切回发 `ping` 重同步 |
| iframe 复用 | iframe 路由默认 `keepAlive`，多系统切换不销毁 |
| 高度自适应 | 子上报 `iframe-resize` |
| 登录态 | 子 `ready` 后主下发 `auth-token`（不走 URL；生产默认忽略 `?token=`） |
| 面包屑 | 子上报 `breadcrumb`，覆盖 Header |

**关键文件**

- 宿主页：`src/views/common/IFrame.vue` → `useIframeHost`
- 子应用（本仓库被嵌入时）：`permission` 内自动 `setupIframeChildBridge`
- 协议与路径：`src/utils/iframeBridge/`
- 第三方脚本：`public/iframe-bridge.js`（同源也可由宿主注入；与 Vue 桥互斥，避免双装）

**菜单配置**

组件填 iframe 页（如 `common/IFrame` / `IFrame`），并在 `meta` 写地址：

```ts
{
  name: 'ExtSystem',
  component: 'common/IFrame',
  meta: {
    title: '外部系统',
    iFrameUrl: 'https://child.example.com/app/', // 必填
  },
}
```

动态路由会挂上 catch-all，例如主应用 `/ExtSystem/user/1` ↔ 子应用 `/user/1`（`meta.iFrameBasePath` 自动写入）。

**子应用接入**

1. **本模板作为子应用**：处于 iframe 中时自动安装 Vue 桥，一般无需改代码。
2. **同源第三方页**：宿主 `load` 后尝试注入 `iframe-bridge.js`。
3. **跨域第三方**：子页自行引入脚本，或手写协议：

```html
<script src="https://host.example.com/iframe-bridge.js"></script>
<!-- 可选：注入前配置 -->
<script>
  window.__IFRAME_BRIDGE__ = {
    targetOrigin: '*',
    trustedParentOrigin: 'https://host.example.com', // 生产建议配置，校验父消息
    syncRoute: true,
    syncHeight: true,
    syncBreadcrumb: true,
  }
</script>
```

面包屑可用 `<meta name="iframe-breadcrumb" content="首页,列表,详情">` 或 `data-iframe-breadcrumb`；也可用 `window.__iframeBridge.postBreadcrumb([...])`。

手写消息时 `source` 必须为 `vue3-template-iframe`：

```js
// 子 → 主
parent.postMessage({ source: 'vue3-template-iframe', type: 'route-change', path: location.pathname }, '*')
parent.postMessage({ source: 'vue3-template-iframe', type: 'breadcrumb', data: ['首页', '详情'] }, '*')
parent.postMessage({ source: 'vue3-template-iframe', type: 'iframe-resize', height: document.body.scrollHeight }, '*')
parent.postMessage({ source: 'vue3-template-iframe', type: 'ready' }, '*')

// 主 → 子（子侧监听）
// { type: 'navigate', path } | { type: 'auth-token', token } | { type: 'ping' }
```

**安全注意**

- 生产宿主按 `iFrameUrl` 校验子消息 origin；开发可放宽（`allowAnyOriginInDev`）。
- 子侧校验父 origin（`trustedParentOrigin` / referrer）；勿再依赖 URL 传 token，除非显式 `VITE_ALLOW_QUERY_TOKEN=true`。



## 环境变量


| 变量                                         | 说明                          |
| ------------------------------------------ | --------------------------- |
| `VITE_baseUrl`                             | 接口前缀，默认 `/api`              |
| `VITE_USE_MOCK`                            | `true` 本地 Mock，`false` 走代理  |
| `VITE_API_PROXY_TARGET`                    | 代理目标（Mock 关闭时）              |
| `VITE_BUILD_URL`                           | 部署 publicPath / base        |
| `VITE_LOGIN_AES_KEY` / `VITE_LOGIN_AES_IV` | 登录密码 AES（本地 `.env.*.local`） |
| `VITE_ALLOW_QUERY_TOKEN`                   | 是否允许 URL `?token=`（生产默认关闭）  |
| `VITE_WS_URL`                              | WebSocket 地址；`false` 关闭 WS       |
| `VITE_ENABLE_I18N`                         | `true` 启用 vue-i18n 业务文案；默认不加载 |


完整本地覆盖示例见 `.env.example`。

## 业务国际化（可选）

默认**不启用** vue-i18n，页面文案以代码中的中文 fallback 为准，零额外包体积。

启用方式（`.env.dev.local` 或构建环境）：

```bash
VITE_ENABLE_I18N=true
```

使用约定：

- 组件内：`const { t } = useT()`，模板/脚本写 `t('login.submit', '登录')`（第二参数为未启用 i18n 或缺翻译时的兜底）
- 模块/工具：`import { t } from '@/i18n'`
- 语言包：`src/locales/zh-CN/`、`src/locales/en-US/` 按模块拆分；切换「界面语言」时与 Naive UI locale 同步

已接入示例：登录页、错误页、SqlSearch、项目设置语言选项。其余页面可按需逐步替换硬编码文案。

## 部署

Docker 与 Nginx 部署说明见 **[DEPLOY.md](./DEPLOY.md)**，包含：

- 多阶段 Docker 构建与 `docker compose up`
- Web / App 双入口 Nginx 配置
- API 网关、WebSocket、Token 刷新对接说明

## Electron

```bash
pnpm electron:install   # 如需单独安装 Electron 相关
pnpm dev:electron       # 开发
pnpm build:electron     # 打包安装包
pnpm build:electron:dir # 仅输出目录
```

主进程代码在 `electron/`，渲染进程复用 Web 构建产物。

已内置：单实例锁、sandbox 渲染进程、IPC 白名单、托盘闪烁、系统通知、自动更新（启动检查 + 周期检查）。更新相关环境变量见 `.env.example`。

## 开发建议

- 新增系统页：先补 `src/api/system/*`，再按现有 System 页用 hooks + 统一 fields 搭页面
- 密钥、本机代理地址只写 `.env.*.local`（已在 `.gitignore`）
- 提交前可跑：`pnpm typecheck`、`pnpm lint`

