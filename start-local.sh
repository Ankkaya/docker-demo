#!/bin/bash
set -e

echo "🚀 Starting local development environment..."

# 清理旧容器
docker-compose down

# 构建并启动数据库
docker-compose up -d db

# 等待数据库就绪
echo "⏳ Waiting for database..."
sleep 5

# 执行迁移
echo "🔄 Running migrations..."
docker-compose run --rm backend npx prisma migrate deploy

# 初始化数据
echo "🌱 Seeding data..."
docker-compose run --rm backend npx prisma db seed

# 构建并启动所有服务
echo "🔨 Building frontend (no cache)..."
docker-compose build --no-cache frontend

echo "🎉 Starting all services..."
docker-compose up -d

echo ""
echo "✅ All services are running!"
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend:  http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/api/docs"
