# Stitch 设计稿归档格式

## 现有目录样式

- `stitch/screens/商品详情 (Product Detail)/`
- `stitch/screens/商品列表页 (Product List)/`
- `stitch/screens/订单列表 (Order List)/`

每个目录通常包含：

- `<featureName>.png`
- `<featureName>.html`
- `metadata.json`
- `download_with_curl.ps1`（如需要重下资源）

## 命名建议

- 目录名用业务名，不用临时设计备注
- `metadata.json` 里的 `screen.title` 保留 Stitch 原始标题
- 文件名与目录名保持一致，便于人工查找

## README 更新方式

在 `stitch/README.md` 的“当前已整理资源”中追加：

```md
- 页面：`screen_id`（页面标题）
- 功能目录：`目录名`
```

不要删除已有记录。
