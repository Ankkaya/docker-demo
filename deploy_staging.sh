#!/bin/bash
set -e

cd /var/www/docker-demo/staging

echo "=== $(date) 开始分步构建 ==="

echo "=== 1/4 构建后端镜像 ==="
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml build backend 2>&1 | tail -3
echo "=== 后端构建完成 ==="

echo "=== 2/4 构建前端镜像 ==="
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml build frontend 2>&1 | tail -3
echo "=== 前端构建完成 ==="

echo "=== 3/4 启动数据库 ==="
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml up -d db
echo "等待数据库就绪..."
for i in $(seq 1 30); do
  if docker compose -f docker-compose.yaml -f docker-compose.staging.yaml exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    echo "数据库就绪!"
    break
  fi
  echo "等待... ($i/30)"
  sleep 2
done

echo "=== 4/4 执行迁移并启动所有服务 ==="
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml run --rm backend npx prisma migrate deploy 2>&1 | tail -5
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml run --rm backend npx prisma db seed 2>&1 | tail -5
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml up -d

echo "=== 健康检查 ==="
for i in $(seq 1 20); do
  if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 测试环境部署成功!"
    echo "前端: http://43.139.44.156:8080"
    echo "后端健康检查: http://43.139.44.156:3001/health"
    exit 0
  fi
  echo "等待后端启动... ($i/20)"
  sleep 3
done

echo "❌ 健康检查失败"
docker compose -f docker-compose.yaml -f docker-compose.staging.yaml ps
exit 1
