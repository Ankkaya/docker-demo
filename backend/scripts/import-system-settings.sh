#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_PATH="$ROOT_DIR/prisma/exports/system-settings-export-$(date +%F).sql"
INPUT_PATH="${1:-$DEFAULT_PATH}"

if [ ! -f "$INPUT_PATH" ]; then
  echo "未找到导入文件: $INPUT_PATH" >&2
  echo "用法: bash scripts/import-system-settings.sh /path/to/system-settings-export.sql" >&2
  exit 1
fi

docker-compose exec -T db psql \
  -U postgres \
  -d docker_demo <<'SQL'
TRUNCATE TABLE "SystemSetting" RESTART IDENTITY CASCADE;
SQL

docker-compose exec -T db psql \
  -U postgres \
  -d docker_demo < "$INPUT_PATH"

echo "配置已导入: $INPUT_PATH"
