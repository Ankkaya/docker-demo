# 环境变量管理方案

本文档说明本项目开发、测试、生产环境的环境变量放置位置、加载规则和推荐实践。项目包含三个运行单元：

- `backend/`：NestJS 后端，运行时读取环境变量。
- `frontend/`：Vue 3 管理后台，Vite 构建时读取环境变量。
- `mobile/`：Uni-app 移动端，Vite/Uni-app 构建时读取环境变量。

核心原则：

- 后端敏感变量以 Docker Compose、CI/CD Secrets、服务器 `.env` 注入为准。
- 前端和移动端只放公开配置，不能放密钥。
- Git 仓库中只提交模板和本地开发默认值，不提交测试/生产真实密钥。

## 1. 文件职责

### 1.1 根目录 `.env`

根目录 `.env` 是 Docker Compose 部署时的变量来源。Compose 默认会读取执行目录下的 `.env`，然后替换 `docker-compose.yaml`、`docker-compose.staging.yaml`、`docker-compose.production.yaml` 中的 `${VAR}`。

推荐用途：

- 测试服务器：`/deploy-path/staging/.env`
- 生产服务器：`/deploy-path/production/.env`
- 本地 Docker Compose 如需覆盖默认值，也可在项目根目录创建 `.env`

注意：

- 根目录真实 `.env` 不提交 Git。
- 建议提交 `.env.example` 作为模板。
- 线上部署应以根目录 `.env`、GitHub Secrets 或云 Secret Manager 为准。

### 1.2 `backend/.env.*`

后端目录下的 `.env.*` 用于 NestJS 运行时兜底加载，主要服务本地开发和手动运行。

当前后端通过 `backend/load-env.ts` 加载环境变量：

```ts
const mode = process.env.NODE_ENV || 'development';

const filenames = [
  `.env.${mode}.local`,
  `.env.local`,
  `.env.${mode}`,
  '.env',
];

dotenv.config({ path: filePath, override: false });
```

加载规则：

- `NODE_ENV=development`：读取 `backend/.env.development`
- `NODE_ENV=staging`：读取 `backend/.env.staging`
- `NODE_ENV=production`：读取 `backend/.env.production`
- 如果系统环境变量或容器环境中已经存在同名变量，`.env.*` 不会覆盖它，因为 `override: false`

推荐用途：

- `backend/.env.development`：可以放本地开发配置。
- `backend/.env.staging`：只放测试环境模板或非敏感默认值。
- `backend/.env.production`：只放生产模板，不放真实生产密钥。
- `backend/.env.*.local`：个人本地私有覆盖文件，不提交 Git。

### 1.3 `frontend/.env.*`

前端由 Vite 自动加载环境变量，不需要类似 `load-env.ts` 的文件。

常见命令：

```bash
pnpm dev --mode development
pnpm build --mode staging
pnpm build --mode production
```

Vite 会读取：

- `.env`
- `.env.local`
- `.env.development`
- `.env.development.local`
- `.env.staging`
- `.env.staging.local`
- `.env.production`
- `.env.production.local`

只有 `VITE_` 前缀变量会暴露给前端代码：

```env
VITE_API_BASE_URL=/api
VITE_FILE_BASE_URL=https://stage-docker-demo.ankkaya.top
```

代码中通过以下方式读取：

```ts
import.meta.env.VITE_API_BASE_URL
```

注意：

- `VITE_*` 会被打包进浏览器静态资源。
- 不要在前端环境变量中放数据库密码、JWT 密钥、微信 AppSecret、支付密钥。

### 1.4 `mobile/.env.*`

移动端同样由 Vite/Uni-app 构建体系加载环境变量，不需要 `load-env.ts`。

推荐只放公开配置：

```env
VITE_API_BASE_URL=https://stage-docker-demo.ankkaya.top/api
VITE_ENV_NAME=staging
```

注意：

- 小程序/H5/App 包中的构建变量可被客户端看到。
- 微信 `AppSecret`、支付密钥、数据库密码、JWT 密钥都不能放在 mobile 环境变量里。

## 2. 优先级说明

### 2.1 后端容器中的优先级

后端容器启动时，Docker Compose 的 `environment:` 会先把变量注入容器环境。

例如：

```yaml
services:
  backend:
    environment:
      NODE_ENV: staging
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
```

随后后端启动，`backend/load-env.ts` 会尝试读取 `backend/.env.staging`。但是因为 `dotenv.config({ override: false })`，如果容器环境里已经有同名变量，`.env.staging` 不会覆盖它。

因此最终优先级是：

1. Docker Compose `environment:` / CI Secrets / 系统环境变量
2. `backend/.env.${NODE_ENV}.local`
3. `backend/.env.local`
4. `backend/.env.${NODE_ENV}`
5. `backend/.env`

结论：

- 容器部署时，Compose/Secrets 是主配置入口。
- `backend/.env.*` 是后端内部兜底，不应作为线上真实密钥来源。

### 2.2 前端和移动端的优先级

前端和移动端的环境变量在构建时确定。

例如前端 Dockerfile：

```dockerfile
ARG VITE_MODE=production
RUN pnpm build --mode ${VITE_MODE}
```

测试环境 compose 中：

```yaml
frontend:
  build:
    args:
      VITE_MODE: staging
```

这表示测试环境构建会读取 `frontend/.env.staging`。构建完成后，变量已经写入静态资源，容器运行时再修改 `.env` 不会改变前端配置，必须重新构建。

## 3. 推荐目录策略

建议保留：

```text
docker-demo/
├── .env.example                  # Compose 部署模板，提交 Git
├── .env                          # 本地或服务器真实部署变量，不提交 Git
├── backend/
│   ├── .env                      # 本地后端默认配置，可逐步改为模板
│   ├── .env.development          # 后端本地开发
│   ├── .env.staging              # 后端测试模板
│   └── .env.production           # 后端生产模板
├── frontend/
│   ├── .env.development          # 前端本地开发公开变量
│   ├── .env.staging              # 前端测试构建公开变量
│   └── .env.production           # 前端生产构建公开变量
└── mobile/
    ├── .env.example              # 移动端公开变量模板
    ├── .env.development
    ├── .env.staging
    └── .env.production
```

建议不提交：

```text
.env
.env.local
.env.*.local
backend/.env.local
backend/.env.*.local
frontend/.env.local
frontend/.env.*.local
mobile/.env.local
mobile/.env.*.local
```

## 4. 推荐变量分层

### 4.1 后端敏感变量

这些变量应由根目录 `.env`、GitHub Secrets、服务器环境变量或 Secret Manager 注入：

```env
DB_PASSWORD=CHANGE_ME
DATABASE_URL=postgresql://postgres:CHANGE_ME@db:5432/docker_demo?schema=public

REDIS_PASSWORD=CHANGE_ME

JWT_SECRET=CHANGE_ME_AT_LEAST_32_CHARS
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_FROM_JWT_SECRET
FILE_BASE_URL=https://your-domain.com

MINIO_ROOT_USER=CHANGE_ME
MINIO_ROOT_PASSWORD=CHANGE_ME
MINIO_ACCESS_KEY=CHANGE_ME
MINIO_SECRET_KEY=CHANGE_ME
MINIO_BUCKET_NAME=docker-demo
```

第三方服务如微信小程序、微信支付、短信、物流等也应放在后端或 Secret 中：

```env
WECHAT_APP_ID=CHANGE_ME
WECHAT_APP_SECRET=CHANGE_ME
WECHAT_PAY_MCH_ID=CHANGE_ME
WECHAT_PAY_API_V3_KEY=CHANGE_ME
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/mall/pay/wechat/notify
```

### 4.2 前端公开变量

前端只放公开地址和构建环境：

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_API_PROXY_STRIP_PREFIX=true
VITE_FILE_BASE_URL=http://localhost:3001
```

测试环境示例：

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=https://stage-docker-demo.ankkaya.top
VITE_API_PROXY_STRIP_PREFIX=false
VITE_FILE_BASE_URL=https://stage-docker-demo.ankkaya.top
```

生产环境示例：

```env
VITE_API_BASE_URL=/api
VITE_FILE_BASE_URL=https://your-production-domain.com
```

### 4.3 移动端公开变量

移动端只放公开 API 地址和环境名：

```env
VITE_API_BASE_URL=https://stage-docker-demo.ankkaya.top/api
VITE_ENV_NAME=staging
```

## 5. 本地开发执行方式

### 5.1 Docker 启动基础服务

```bash
docker compose up -d db redis minio
```

### 5.2 后端本地运行

```bash
cd backend
pnpm install
NODE_ENV=development pnpm start:dev
```

后端会读取 `backend/.env.development`。如果没有显式设置 `NODE_ENV`，默认也是 `development`。

### 5.3 前端本地运行

```bash
cd frontend
pnpm install
pnpm dev --mode development
```

前端会读取 `frontend/.env.development`，并通过 Vite proxy 转发 `/api`。

### 5.4 移动端本地运行

```bash
cd mobile
pnpm install
pnpm dev:h5
```

根据移动端脚本配置读取对应 mode 的 `.env.*`。

## 6. 测试环境部署执行方式

测试服务器目录建议：

```text
/home/ubuntu/docker-demo/staging/
```

在测试服务器该目录创建真实 `.env`：

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

部署命令：

```bash
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml build
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml up -d
```

测试环境注意：

- 不要依赖 compose 中的弱默认值。
- 前端构建会使用 `frontend/.env.staging`。
- 后端容器实际配置主要来自根目录 `.env` 和 compose `environment:`。
- `backend/.env.staging` 只是兜底模板。

## 7. 生产环境部署执行方式

生产服务器目录建议：

```text
/home/ubuntu/docker-demo/production/
```

生产 `.env` 必须使用独立于测试环境的密钥：

```env
DB_PASSWORD=真实生产数据库强密码
DATABASE_URL=postgresql://postgres:真实生产数据库强密码@db:5432/docker_demo?schema=public

REDIS_PASSWORD=真实生产Redis强密码

JWT_SECRET=真实生产JWT长随机字符串
JWT_REFRESH_SECRET=真实生产Refresh长随机字符串
FILE_BASE_URL=https://your-production-domain.com

MINIO_ROOT_USER=真实生产MinIO管理员
MINIO_ROOT_PASSWORD=真实生产MinIO管理员强密码
MINIO_ACCESS_KEY=真实生产MinIOAccessKey
MINIO_SECRET_KEY=真实生产MinIOSecretKey
MINIO_BUCKET_NAME=docker-demo
```

部署命令：

```bash
docker compose -f docker-compose.yaml -f docker-compose.production.yaml build
docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d
```

生产环境要求：

- 真实 `.env` 权限建议为 `600`。
- 不要使用 `backend/.env.production` 存放真实生产密钥。
- 不要把生产密钥提交 Git。
- 前端生产构建变量只能是公开地址。
- 数据库、Redis、MinIO Console 不应对公网暴露。

## 8. 建议改造项

为了降低误用默认弱密码的风险，建议后续做以下改造：

1. 新增根目录 `.env.example`，统一列出 Compose 部署需要的变量。
2. 将 `docker-compose.staging.yaml` 中的弱默认值改为强制要求：

```yaml
DATABASE_URL: ${DATABASE_URL:?必须设置 DATABASE_URL}
JWT_SECRET: ${JWT_SECRET:?必须设置 JWT_SECRET}
REDIS_PASSWORD: ${REDIS_PASSWORD:?必须设置 REDIS_PASSWORD}
MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:?必须设置 MINIO_SECRET_KEY}
```

3. 将 `docker-compose.production.yaml` 中仍带默认值的 MinIO 变量改为强制要求。
4. 根据 `ENABLE_SWAGGER` 或 `NODE_ENV` 控制生产环境 Swagger 是否开放。
5. 根据环境变量配置 CORS 白名单，例如：

```env
CORS_ORIGINS=https://admin.example.com,https://m.example.com
```

6. 明确 `.gitignore` 是否覆盖所有真实本地变量文件。

## 9. 常见误区

### 9.1 误区：后端容器会自动读取 `backend/.env.staging`

容器中后端确实可能读取到 `backend/.env.staging`，但前提是文件被复制进镜像，且 `NODE_ENV=staging`。即便读取到，如果 Compose 已经通过 `environment:` 注入了同名变量，因为 `override: false`，`.env.staging` 也不会覆盖 Compose 的值。

正确理解：

- Docker Compose 是容器部署的主配置入口。
- `backend/.env.*` 是后端运行时兜底。

### 9.2 误区：修改前端容器里的 `.env` 后配置会生效

不会。前端和移动端变量在构建时写入静态资源，运行时修改 `.env` 不会改变已构建的 JS。

正确操作：

```bash
pnpm build --mode staging
```

或通过 Docker 重新 build：

```bash
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml build frontend
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml up -d frontend
```

### 9.3 误区：`VITE_*` 可以放密钥

不能。`VITE_*` 变量会暴露到客户端，用户可以查看到。

禁止放入前端和移动端：

- 数据库密码
- JWT 密钥
- 微信 AppSecret
- 微信支付 APIv3 Key
- MinIO Secret Key
- 管理员账号密码
