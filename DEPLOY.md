# 部署指南

本文说明如何将 **Vue3 Template** 构建为静态资源并交付运行（Docker / Nginx / 静态托管）。

## 构建产物

项目为 **MPA** 结构：

| 入口 | 访问路径 | 构建 HTML |
| --- | --- | --- |
| Web 管理端 | `/` | `dist/index.html` |
| App 端 | `/app/` | `dist/app/index.html` |

```bash
pnpm install
pnpm build
```

产物目录默认 `dist/`（由 `.env.build` 中 `VITE_outputDir` 控制）。

## 环境变量（构建时注入）

| 变量 | 说明 | 生产建议 |
| --- | --- | --- |
| `VITE_baseUrl` | 前端请求 API 前缀 | `/api` |
| `VITE_BUILD_URL` | 静态资源 publicPath | `/` 或子路径如 `/admin/` |
| `VITE_WS_URL` | WebSocket 地址；支持 `{token}` 占位 | `wss://your-domain/ws?token={token}` |
| `VITE_WS_URL=false` | 关闭 WS，仅使用 HTTP 轮询 | Mock / 无 WS 后端时 |
| `VITE_LOGIN_AES_KEY/IV` | 登录 AES（与后端一致） | 放 `.env.build.local`，勿提交 |

子路径部署示例：

```bash
VITE_BUILD_URL=/admin/ pnpm build
```

Nginx 需将 `/admin/` 指向 `dist/`，并保留 `/admin/app/` 给 App 端。

## Docker 一键部署

### 仅前端

```bash
docker compose up -d --build
```

默认映射 **http://localhost:8080**。

### 自定义 API 前缀（构建参数）

```bash
docker build \
  --build-arg VITE_baseUrl=/api \
  --build-arg VITE_BUILD_URL=/ \
  -t vue3-template:latest .
docker run -d -p 8080:80 vue3-template:latest
```

### 与后端联调

1. 前端容器只负责静态资源；`/api` 需由网关转发到 Java / Node 等服务。
2. 修改 `docker/nginx.conf` 中 `/api/` 段，改为 `proxy_pass http://your-backend;`
3. 或使用 `docker compose --profile api up` 启动示例 API 反代（需配置 `BACKEND_URL`）。

WebSocket 需在后端或网关上单独配置 `/ws` 升级；前端通过 `VITE_WS_URL` 指向该地址。

## Nginx 手动部署

1. 执行 `pnpm build`
2. 将 `dist/` 上传到服务器
3. 参考 `docker/nginx.conf` 配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
location /app/ {
    try_files $uri $uri/ /app/index.html;
}
location /api/ {
    proxy_pass http://127.0.0.1:8080;
}
```

## 鉴权与错误页

- **401**：自动尝试 `POST /auth/refresh` 刷新 Token；失败则跳转登录页。
- **403 / 500**：跳转 `/403`、`/500` 独立错误页。
- **404**：未匹配路由跳转 `/404`。

登录成功后返回字段建议：

```json
{
  "token": "access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 7200,
  "username": "admin"
}
```

## 消息推送

- 优先连接 WebSocket（`VITE_WS_URL` 或默认 `/ws?token=`）。
- 连接失败时自动降级为 `GET /message/recent?since=` 轮询（Mock 已提供）。
- 消息体格式：

```json
{
  "id": "msg-1",
  "title": "标题",
  "content": "内容",
  "type": "notice",
  "time": "2026-08-26T08:00:00.000Z"
}
```

## 首页仪表盘

- 接口：`GET /dashboard/stats`
- Mock 已内置；对接真实后端时返回用户/在线/公告/操作统计及图表序列即可。

## 常见问题

**Q: 刷新子路由 404？**  
A: 确认 Nginx `try_files` 回退到对应 `index.html`。

**Q: App 端资源 404？**  
A: 检查 `VITE_BUILD_URL` 与 Nginx 中 `/app/` 配置是否一致。

**Q: 登录后接口 401？**  
A: 确认网关转发 `token` / `Authorization` 头，并实现 `/auth/refresh`。

**Q: 没有 WebSocket 服务？**  
A: 设置 `VITE_WS_URL=false`，使用轮询通道即可。
