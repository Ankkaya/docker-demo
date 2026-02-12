# PowerShell script for Windows
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting local development environment..." -ForegroundColor Cyan

# 清理旧容器
Write-Host "🧹 Cleaning up old containers..." -ForegroundColor Yellow
docker-compose down -v

# 构建并启动数据库
Write-Host "📦 Starting database..." -ForegroundColor Yellow
docker-compose up -d db

# 等待数据库就绪
Write-Host "⏳ Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 重新构建 backend（确保代码最新）
Write-Host "🔨 Building backend (no cache)..." -ForegroundColor Yellow
docker-compose build --no-cache backend

# 执行迁移
Write-Host "🔄 Running migrations..." -ForegroundColor Yellow
docker-compose run --rm backend npx prisma migrate deploy

# 初始化数据
Write-Host "🌱 Seeding data..." -ForegroundColor Yellow
docker-compose run --rm backend npx prisma db seed

# 构建并启动所有服务
Write-Host "🔨 Building frontend (no cache)..." -ForegroundColor Yellow
docker-compose build --no-cache frontend

Write-Host "🎉 Starting all services with build check..." -ForegroundColor Green
docker-compose up -d --build

Write-Host ""
Write-Host "✅ All services are running!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:8080"
Write-Host "🔧 Backend:  http://localhost:3001"
Write-Host "📚 API Docs: http://localhost:3001/api/docs"
