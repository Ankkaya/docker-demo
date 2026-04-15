$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$exportDir = Join-Path $rootDir 'prisma\exports'
$dateTag = Get-Date -Format 'yyyy-MM-dd'
$outputPath = if ($args.Count -gt 0) { $args[0] } else { Join-Path $exportDir "system-settings-export-$dateTag.sql" }

New-Item -ItemType Directory -Force -Path $exportDir | Out-Null

$command = "docker-compose exec -T db pg_dump -U postgres -d docker_demo --data-only --column-inserts --table='""SystemSetting""' > `"$outputPath`""
powershell -NoProfile -Command $command

Write-Output "配置已导出到: $outputPath"
