#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXPORT_DIR="$ROOT_DIR/prisma/exports"
DATE_TAG="$(date +%F)"
OUTPUT_PATH="${1:-$EXPORT_DIR/system-settings-export-$DATE_TAG.sql}"

mkdir -p "$EXPORT_DIR"

docker-compose exec -T db pg_dump \
  -U postgres \
  -d docker_demo \
  --data-only \
  --column-inserts \
  --table='"SystemSetting"' > "$OUTPUT_PATH"

echo "配置已导出到: $OUTPUT_PATH"
