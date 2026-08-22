# 🚀 自动化部署配置指南

本文档说明如何完成双环境（测试 + 正式）自动化部署的 GitHub 配置。

---

## 一、整体架构

```
开发人员 push 代码
  │
  ├─→ push 到 main 分支
  │     ├─→ CI（构建+测试）✅ 自动触发
  │     └─→ Deploy Staging ✅ 自动部署到测试环境
  │
  └─→ push 到 master 分支
        ├─→ CI（构建+测试）✅ 自动触发
        └─→ Deploy Production ⚠️ 需人工审批后部署到正式环境
```

### 不同服务器双环境端口分配

| 服务 | 测试环境端口 | 正式环境端口 |
|------|------------|------------|
| PostgreSQL | 5432 | 不暴露 |
| Backend API | 3001 | 3001 |
| Frontend | 8080 | 8080 |
| MinIO API | 9000 | 9000 |
| MinIO Console | 9001 | 不暴露 |

### 访问地址

| 环境 | 前台 | 后台 API |
|------|------|---------|
| 测试 | `http://测试服务器IP:8080` | `http://测试服务器IP:3001/health` |
| 正式 | `http://生产服务器IP:8080` | `http://生产服务器IP:3001/health` |

---

## 二、GitHub 仓库配置（必做）

### 2.1 配置 Environment

进入仓库 **Settings → Environments**，创建：

#### staging 环境
| 配置项 | 值 |
|--------|---|
| Name | `staging` |
| Required reviewers | 不勾选 |
| Deployment branch | `main` |

#### production 环境
| 配置项 | 值 |
|--------|---|
| Name | `production` |
| Required reviewers | ✅ 勾选，添加你的 GitHub 用户名 |
| Wait timer | 建议 1 分钟（给反悔时间） |
| Deployment branch | `master` |

> 测试和正式部署到不同服务器时，必须用 GitHub Environment 隔离两套 Secrets。

### 2.2 配置 Secrets（按 Environment 分别配置）

进入仓库 **Settings → Environments → staging / production → Environment secrets**，分别添加 Secrets。

#### staging 环境

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `SERVER_HOST` | 测试服务器 IP | `123.45.67.89` |
| `SERVER_USER` | SSH 用户名 | `ubuntu` |
| `SSH_PASSWORD` | SSH 登录密码 | `你的测试服务器SSH密码` |
| `SSH_TARGET_DIR` | 测试服务器项目部署目录 | `/home/ubuntu/docker-demo` |

#### production 环境

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `SERVER_HOST` | 生产服务器 IP | `123.45.67.89` |
| `SERVER_USER` | SSH 用户名 | `ubuntu` |
| `SSH_PRIVATE_KEY` | SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_TARGET_DIR` | 生产服务器项目部署目录 | `/home/ubuntu/docker-demo` |

> staging 当前使用密码登录；production 仍推荐使用私钥登录，并保留审批保护。

### 2.3 生成 production SSH 密钥对（如未配置）

```bash
# 在本地生成密钥
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/actions_deploy

# 将公钥添加到生产服务器的 authorized_keys
ssh-copy-id -i ~/.ssh/actions_deploy.pub ubuntu@你的服务器IP

# 将私钥内容复制到 production Environment Secrets（SSH_PRIVATE_KEY）
cat ~/.ssh/actions_deploy
```

---

## 三、服务器准备（必做）

### 3.1 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 验证
docker --version
docker compose version
```

### 3.2 创建目录结构

```bash
mkdir -p /home/ubuntu/docker-demo
```

### 3.3 创建测试环境 .env

```bash
cat > /home/ubuntu/docker-demo/.env << 'EOF'
# ====== 数据库 ======
DB_PASSWORD=测试数据库强密码
DATABASE_URL=postgresql://postgres:测试数据库强密码@db:5432/docker_demo?schema=public

# ====== Redis ======
REDIS_PASSWORD=测试Redis强密码

# ====== 应用 ======
JWT_SECRET=测试JWT密钥至少32位随机字符
JWT_REFRESH_SECRET=测试Refresh密钥至少32位随机字符
SYSTEM_SETTINGS_ENCRYPTION_KEY=测试环境独立的至少32位随机字符
FILE_BASE_URL=http://测试服务器IP:3001
ENABLE_SWAGGER=true
CORS_ORIGINS=http://测试服务器IP:8080

# ====== MinIO ======
MINIO_ROOT_USER=测试MinIO管理员
MINIO_ROOT_PASSWORD=测试MinIO强密码
MINIO_ACCESS_KEY=测试MinIO访问Key
MINIO_SECRET_KEY=测试MinIO访问Secret
EOF
chmod 600 /home/ubuntu/docker-demo/.env
```

### 3.4 创建正式环境 .env

```bash
cat > /home/ubuntu/docker-demo/.env << 'EOF'
# ====== 数据库 ======
DB_PASSWORD=你的正式数据库强密码
DATABASE_URL=postgresql://postgres:你的正式数据库强密码@db:5432/docker_demo?schema=public

# ====== Redis ======
REDIS_PASSWORD=你的正式Redis强密码

# ====== 应用 ======
JWT_SECRET=你的正式JWT密钥至少32位随机字符
JWT_REFRESH_SECRET=你的正式Refresh密钥至少32位随机字符
SYSTEM_SETTINGS_ENCRYPTION_KEY=你的正式系统设置加密密钥至少32位随机字符
FILE_BASE_URL=https://你的正式域名
ENABLE_SWAGGER=false
CORS_ORIGINS=https://你的正式域名

# ====== MinIO ======
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=你的MinIO强密码
MINIO_ACCESS_KEY=你的MinIO访问Key
MINIO_SECRET_KEY=你的MinIO访问Secret
EOF
chmod 600 /home/ubuntu/docker-demo/.env
```

### 3.5 添加 GitHub Deploy Key（用于 git clone）

```bash
ssh-keygen -t ed25519 -C "server-git" -f ~/.ssh/server_git
cat ~/.ssh/server_git.pub  # → 添加到 GitHub 仓库 Settings → Deploy Keys（勾选读权限）
```

---

## 四、分支策略

```
main    → 日常开发，push 自动部署到测试环境
master  → 稳定发布，push 需审批后部署到正式环境
```

### 发布流程

```bash
# 1. 在 main 上开发和测试
git checkout main
git pull
# ... 开发 ...

# 2. 测试环境验证通过后，合并到 master
git checkout master
git merge main
git push origin master

# 3. GitHub Actions 自动触发审批流程
#    → 你会在 GitHub 收到审批通知 → 点击 Approve → 自动部署
```

---

## 五、文件清单

本次新增/修改的文件：

### 新增
| 文件 | 说明 |
|------|------|
| `frontend/.env.development` | 前端开发环境配置 |
| `frontend/.env.staging` | 前端测试环境配置 |
| `frontend/.env.production` | 前端正式环境配置 |
| `backend/.env.development` | 后端开发环境配置 |
| `backend/.env.staging` | 后端测试环境配置 |
| `backend/.env.production` | 后端正式环境配置 |
| `docker-compose.staging.yaml` | 测试环境 Docker 编排覆盖（独立服务器，端口与生产一致） |
| `docker-compose.production.yaml` | 正式环境 Docker 编排覆盖（安全加固） |
| `.github/workflows/ci.yml` | CI 工作流（所有分支） |
| `.github/workflows/deploy-staging.yml` | 测试环境部署工作流 |
| `.github/workflows/deploy-production.yml` | 正式环境部署工作流 |

### 修改
| 文件 | 变更 |
|------|------|
| `docker-compose.yaml` | 添加多环境使用说明注释 |
| `frontend/Dockerfile` | 支持 VITE_MODE build arg |
| `.gitignore` | 环境文件策略调整 |
| `backend/.gitignore` | 环境文件策略调整 |

### 删除
| 文件 | 原因 |
|------|------|
| `.github/workflows/deploy.yml` | 已拆分为三个独立工作流 |

---

## 六、验证方式

完成配置后，验证流程：

1. **推送 main 分支** → 检查 GitHub Actions 是否触发 CI + Deploy Staging
2. **推送 master 分支** → 检查 GitHub Actions 是否触发 CI + Deploy Production（需审批）
3. **手动触发** → Actions 页面选择 workflow → Run workflow
