# 环境变量管理优化方案

本文档定义本项目环境变量的目标管理方式、当前风险点和落地步骤。项目包含三个运行单元：

- `backend/`：NestJS API，运行时读取环境变量，可包含敏感配置。
- `frontend/`：Vue 3 管理后台，Vite 构建时读取变量，只允许公开配置。
- `mobile/`：Uni-app 移动端，Vite/Uni-app 构建时读取变量，只允许公开配置。

## 1. 总体原则

- **单一部署入口**：Docker/服务器部署统一从根目录 `.env`、CI/CD Secrets 或 Secret Manager 注入，后端镜像内 `.env.*` 只作为本地兜底。
- **敏感信息不上客户端**：`frontend/`、`mobile/` 中的 `VITE_*` 会被打包到浏览器、小程序或 App 包内，禁止放数据库密码、JWT 密钥、微信 `AppSecret`、支付密钥、MinIO Secret 等。
- **模板可提交，真实值不提交**：提交 `.env.example` 和非敏感开发默认值；真实 `.env`、`.env.local`、`.env.*.local` 不提交。
- **生产强制显式配置**：生产和测试部署不依赖 compose 中的弱默认值，关键变量应使用 `${VAR:?错误提示}` 强制校验。
- **构建变量不可运行时热更新**：前端/移动端变量在构建时固化，修改变量后必须重新 build。

## 2. 当前现状与问题

### 2.1 已有能力

- 后端入口 `backend/src/main.ts` 会先导入 `backend/load-env.ts`，支持按 `NODE_ENV` 加载 `.env.*`。
- 后端 Docker Compose 已注入 `DATABASE_URL`、`REDIS_URL`、`REDIS_PASSWORD`、`JWT_SECRET`、MinIO 等变量。
- `frontend/Dockerfile` 通过 `ARG VITE_MODE=production` 控制 `pnpm build --mode ${VITE_MODE}`。
- `mobile/` 已有 `.env.example`、`.env.development`、`.env.staging`、`.env.production`。

### 2.2 需要优化的问题

- 根目录缺少统一的 `.env.example`，部署变量分散在 compose、后端 env、前端 env、移动端 env 中。
- `docker-compose.staging.yaml` 中仍有 `staging_password`、`staging-jwt-secret`、`minioadmin123` 等弱默认值。
- `docker-compose.production.yaml` 中 `MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY` 仍允许弱默认值。
- `backend/.env.production` 存在 `CHANGE_ME` 模板值，容易被误当成真实生产配置来源。
- 后端 CORS 当前为 `app.enableCors()` 全开放，Swagger 当前默认开放，缺少环境变量开关。
- 前端生产变量当前指向 `http://localhost:3001`，实际生产部署前必须改成公网域名或反向代理路径。

## 3. 文件职责设计

| 文件 | 是否提交 | 使用场景 | 说明 |
|---|---:|---|---|
| `.env.example` | 是 | Docker/服务器部署模板 | 统一列出 compose 需要的变量，不放真实值 |
| `.env` | 否 | 本地 compose 或服务器真实部署 | Docker Compose 默认读取，用于替换 `${VAR}` |
| `.env.local` / `.env.*.local` | 否 | 个人本地覆盖 | 所有目录均不提交 |
| `backend/.env.development` | 可提交 | 后端本地开发 | 允许本地弱默认值，禁止生产真实密钥 |
| `backend/.env.staging` | 可提交 | 后端测试兜底模板 | 只放非敏感默认值或占位符 |
| `backend/.env.production` | 可提交 | 后端生产模板 | 只放占位符，生产真实值必须外部注入 |
| `frontend/.env.*` | 可提交 | 管理后台构建 | 只放公开地址和构建配置 |
| `mobile/.env.*` | 可提交 | 移动端构建 | 只放公开地址和构建配置 |

推荐目录结构：

```text
docker-demo/
├── .env.example
├── .env                       # 不提交
├── backend/
│   ├── .env.development
│   ├── .env.staging
│   └── .env.production
├── frontend/
│   ├── .env.development
│   ├── .env.staging
│   └── .env.production
└── mobile/
    ├── .env.example
    ├── .env.development
    ├── .env.staging
    └── .env.production
```

## 4. 加载优先级

### 4.1 后端运行时

后端通过 `backend/load-env.ts` 读取环境变量，`override: false` 表示已存在的系统变量不会被文件覆盖。

加载顺序：

1. 系统环境变量 / Docker Compose `environment:` / CI Secrets
2. `backend/.env.${NODE_ENV}.local`
3. `backend/.env.local`
4. `backend/.env.${NODE_ENV}`
5. `backend/.env`

注意事项：

- 容器部署时以 Compose/Secrets 注入为主，`backend/.env.*` 只是兜底。
- `load-env.ts` 会搜索 `process.cwd()` 和 `__dirname`；Docker 运行产物中未复制 `.env.*` 时，不应依赖镜像内 env 文件。
- `NODE_ENV` 未设置时默认按 `development` 读取。

### 4.2 前端与移动端构建时

Vite/Uni-app 按 mode 加载 `.env` 文件，只有 `VITE_` 前缀变量会暴露给业务代码。

常用命令：

```bash
cd frontend
pnpm dev --mode development
pnpm build --mode staging
pnpm build --mode production

cd mobile
pnpm dev:h5
pnpm build:h5:staging
pnpm build:mp-weixin:production
```

重点：

- `frontend/Dockerfile` 的 `VITE_MODE` 决定读取 `frontend/.env.${VITE_MODE}`。
- 修改 `frontend/.env.*` 或 `mobile/.env.*` 后必须重新构建。
- 前端和移动端不要读取后端密钥，所有私密能力必须通过后端接口完成。

## 5. 变量清单

### 5.1 后端核心变量

| 变量 | 必填 | 示例 | 说明 |
|---|---:|---|---|
| `NODE_ENV` | 是 | `development` / `staging` / `production` | 运行环境 |
| `PORT` | 否 | `3001` | 后端监听端口 |
| `DATABASE_URL` | 是 | `postgresql://postgres:***@db:5432/docker_demo?schema=public` | Prisma/PostgreSQL 连接 |
| `REDIS_URL` | 是 | `redis://redis:6379` | Redis 地址，登录限流使用 |
| `REDIS_PASSWORD` | 视部署而定 | `***` | Redis 密码 |
| `JWT_SECRET` | 是 | 长随机字符串 | Access Token 签名密钥 |
| `JWT_REFRESH_SECRET` | 推荐 | 长随机字符串 | Refresh Token 签名密钥，建议与 `JWT_SECRET` 不同 |
| `JWT_REFRESH_EXPIRES_IN` | 否 | `30d` | Refresh Token 有效期 |
| `LOGIN_RSA_PUBLIC_KEY` | 否 | PEM 字符串 | 登录加密公钥，支持 `\n` 转义 |
| `LOGIN_RSA_PRIVATE_KEY` | 否 | PEM 字符串 | 登录解密私钥，支持 `\n` 转义 |
| `FILE_BASE_URL` | 推荐 | `https://api.example.com` | 文件访问公网基地址 |
| `PUBLIC_BASE_URL` | 否 | `https://api.example.com` | 文件 URL 兜底基地址 |
| `APP_BASE_URL` | 否 | `https://api.example.com` | 文件 URL 兜底基地址 |
| `APP_PROTOCOL` | 否 | `https` | 未显式配置基地址时拼接使用 |
| `APP_HOST` | 否 | `api.example.com` | 未显式配置基地址时拼接使用 |

### 5.2 MinIO 变量

| 变量 | 必填 | 示例 | 说明 |
|---|---:|---|---|
| `MINIO_ENDPOINT` | 是 | `minio` | 后端访问 MinIO 的主机名 |
| `MINIO_PORT` | 是 | `9000` | MinIO API 端口 |
| `MINIO_USE_SSL` | 是 | `false` | 内网 compose 通常为 `false` |
| `MINIO_ACCESS_KEY` | 是 | `***` | 后端访问 MinIO 的 Access Key |
| `MINIO_SECRET_KEY` | 是 | `***` | 后端访问 MinIO 的 Secret Key |
| `MINIO_BUCKET_NAME` | 是 | `docker-demo` | 文件桶名 |
| `MINIO_ROOT_USER` | 部署必填 | `***` | MinIO 管理员账号 |
| `MINIO_ROOT_PASSWORD` | 部署必填 | `***` | MinIO 管理员密码 |
| `MINIO_SKIP_INIT` | 否 | `true` | 测试或特殊场景跳过 bucket 初始化 |

### 5.3 微信与支付变量

| 变量 | 必填 | 示例 | 说明 |
|---|---:|---|---|
| `WECHAT_APP_ID` | 视功能而定 | `wx...` | 微信小程序 AppID |
| `WECHAT_APP_SECRET` | 视功能而定 | `***` | 微信小程序 AppSecret，只能放后端 |
| 微信支付商户号/证书/APIv3 Key | 视功能而定 | `***` | 当前主要从系统设置读取，建议最终也支持 Secret 注入兜底 |

### 5.4 前端公开变量

| 变量 | 必填 | 示例 | 说明 |
|---|---:|---|---|
| `VITE_API_BASE_URL` | 是 | `/api` | 管理后台 API 基地址 |
| `VITE_FILE_BASE_URL` | 推荐 | `https://api.example.com` | 文件公网基地址 |
| `VITE_API_PROXY_TARGET` | 开发必填 | `http://localhost:3001` | Vite dev proxy 目标 |
| `VITE_API_PROXY_STRIP_PREFIX` | 否 | `true` | dev proxy 是否移除 `/api` 前缀 |

### 5.5 移动端公开变量

| 变量 | 必填 | 示例 | 说明 |
|---|---:|---|---|
| `VITE_API_BASE_URL` | 是 | `https://api.example.com/api` | 移动端 API 基地址 |
| `VITE_ENV_NAME` | 推荐 | `staging` | 环境标识，仅用于展示/日志 |
| `VITE_AUTH_LOGIN_METHODS` | 否 | `wechat,password` | 客户端登录方式开关，公开配置 |
| `VITE_AUTH_DEFAULT_AVATAR_URL` | 否 | `https://...` | 默认头像 URL |

`mobile/.env.example` 中的 `WECHAT_MINIPROGRAM_APPID`、`WECHAT_UPLOAD_*` 属于小程序上传工具配置，不应打包给业务代码；私钥文件必须本地或 CI Secret 管理，不提交。

## 6. 推荐 `.env.example`

建议新增根目录 `.env.example`，作为 Docker Compose 部署模板：

```env
# Database
DB_PASSWORD=CHANGE_ME
DATABASE_URL=postgresql://postgres:CHANGE_ME@db:5432/docker_demo?schema=public

# Redis
REDIS_PASSWORD=CHANGE_ME

# Backend
NODE_ENV=production
PORT=3001
FILE_BASE_URL=https://your-domain.com
JWT_SECRET=CHANGE_ME_AT_LEAST_32_CHARS
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_FROM_JWT_SECRET
JWT_REFRESH_EXPIRES_IN=30d

# MinIO
MINIO_ROOT_USER=CHANGE_ME
MINIO_ROOT_PASSWORD=CHANGE_ME
MINIO_ACCESS_KEY=CHANGE_ME
MINIO_SECRET_KEY=CHANGE_ME
MINIO_BUCKET_NAME=docker-demo

# WeChat, optional
WECHAT_APP_ID=
WECHAT_APP_SECRET=
```

## 7. 环境示例

### 7.1 本地开发

基础服务：

```bash
docker compose up -d db redis minio
```

后端：

```bash
cd backend
pnpm install
NODE_ENV=development pnpm start:dev
```

前端：

```bash
cd frontend
pnpm install
pnpm dev --mode development
```

移动端：

```bash
cd mobile
pnpm install
pnpm dev:h5
```

### 7.2 测试环境部署

测试服务器创建真实 `.env`：

```env
DB_PASSWORD=真实测试数据库密码
DATABASE_URL=postgresql://postgres:真实测试数据库密码@db:5432/docker_demo?schema=public
REDIS_PASSWORD=真实测试Redis密码
JWT_SECRET=真实测试JWT长随机字符串
JWT_REFRESH_SECRET=真实测试Refresh长随机字符串
FILE_BASE_URL=https://stage-docker-demo.ankkaya.top
MINIO_ROOT_USER=真实测试MinIO管理员
MINIO_ROOT_PASSWORD=真实测试MinIO管理员密码
MINIO_ACCESS_KEY=真实测试MinIOAccessKey
MINIO_SECRET_KEY=真实测试MinIOSecretKey
MINIO_BUCKET_NAME=docker-demo
```

部署：

```bash
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml build
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml up -d
```

### 7.3 生产环境部署

生产 `.env` 必须独立于测试环境，且权限建议设置为 `600`：

```bash
chmod 600 .env
docker compose -f docker-compose.yaml -f docker-compose.production.yaml build
docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d
```

生产要求：

- 不使用 `backend/.env.production` 保存真实密钥。
- 不复用测试环境数据库、Redis、JWT、MinIO、微信支付密钥。
- PostgreSQL、Redis、MinIO Console 不直接暴露公网。
- 前端生产变量指向公网域名或 Nginx 反向代理路径，不能保留 `localhost`。

## 8. 落地改造步骤

### P0：安全基线

1. 新增根目录 `.env.example`，覆盖 Compose 部署所需变量。
2. 补齐 `.gitignore`：`.env`、`.env.local`、`.env.*.local`、`backend/.env.local`、`frontend/.env.local`、`mobile/.env.local`、小程序上传私钥。
3. 将 `docker-compose.production.yaml` 中 `MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY` 改为强制要求。
4. 将 `docker-compose.staging.yaml` 中 `DATABASE_URL`、`JWT_SECRET`、`MINIO_SECRET_KEY`、`MINIO_ROOT_PASSWORD` 等弱默认值改为强制要求。
5. 修正 `frontend/.env.production`，不要指向 `http://localhost:3001`。

### P1：运行时治理

1. 增加 `ENABLE_SWAGGER`，生产默认关闭或只在内网开放。
2. 增加 `CORS_ORIGINS`，替换当前全开放 CORS。
3. 启动时校验生产必填变量，遇到 `CHANGE_ME`、`your-secret-key`、过短 JWT 密钥时直接失败。
4. 统一 Redis 变量，只保留实际使用的 `REDIS_URL`、`REDIS_PASSWORD`，删除无效的 `REDIS_HOST`、`REDIS_PORT` 或在代码中补充支持。

### P2：长期优化

1. 引入 `@nestjs/config` + Joi/Zod schema，集中定义变量类型、默认值和必填规则。
2. 微信支付商户号、证书、APIv3 Key 支持从 Secret 注入，并与系统设置形成明确优先级。
3. CI 增加环境变量检查步骤，防止生产构建使用 localhost、弱密钥或空域名。
4. 按环境拆分部署目录，例如 `/opt/docker-demo/staging` 和 `/opt/docker-demo/production`，避免 `.env` 混用。

## 9. 常见误区

### 9.1 后端容器会自动以 `backend/.env.production` 为准

不应这样理解。容器部署的主配置入口是 Compose/Secrets。即便镜像内存在 `.env.production`，由于 `override: false`，外部注入的变量仍优先。

### 9.2 修改前端容器里的 `.env` 会立即生效

不会。Vite 变量已经写入静态 JS，必须重新构建并重新部署前端镜像。

### 9.3 `VITE_*` 可以隐藏密钥

不能。`VITE_*` 会进入客户端产物，用户可通过浏览器开发者工具、小程序包或 App 包看到。

### 9.4 测试环境可以长期使用弱默认值

不建议。测试环境通常也连接公网域名和真实三方服务，弱数据库、Redis、MinIO、JWT 密钥会导致数据泄露和越权风险。

