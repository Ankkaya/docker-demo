#!/bin/bash
set -e

echo "🚀 Starting local development environment..."

# 清理旧容器
echo "🧹 Cleaning up old containers..."
docker-compose down -v

# 构建并启动数据库
echo "📦 Starting database..."
docker-compose up -d db

# 等待数据库就绪
echo "⏳ Waiting for database..."
sleep 5

# 重新构建 backend（确保代码最新）
echo "🔨 Building backend (no cache)..."
docker-compose build --no-cache backend

# 执行迁移
echo "🔄 Running migrations..."
docker-compose run --rm backend npx prisma migrate deploy

# 初始化数据
echo "🌱 Seeding data..."
docker-compose run --rm backend npx prisma db seed

# 构建并启动所有服务
echo "🔨 Building frontend (no cache)..."
docker-compose build --no-cache frontend

echo "🎉 Starting all services with build check..."
docker-compose up -d --build

echo ""
echo "✅ All services are running!"
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend:  http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/api/docs"
