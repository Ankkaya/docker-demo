$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dateTag = Get-Date -Format 'yyyy-MM-dd'
$defaultPath = Join-Path $rootDir "prisma\exports\system-settings-export-$dateTag.sql"
$inputPath = if ($args.Count -gt 0) { $args[0] } else { $defaultPath }

if (-not (Test-Path $inputPath)) {
  throw "未找到导入文件: $inputPath"
}

docker-compose exec -T db psql -U postgres -d docker_demo -c 'TRUNCATE TABLE "SystemSetting" RESTART IDENTITY CASCADE;'
Get-Content -Raw $inputPath | docker-compose exec -T db psql -U postgres -d docker_demo

Write-Output "配置已导入: $inputPath"
