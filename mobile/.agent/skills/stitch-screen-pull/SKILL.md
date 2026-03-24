---
name: stitch-screen-pull
description: 拉取并归档 Stitch 设计稿资源。用于获取 Stitch 项目或 screen 的截图、HTML 导出、metadata 和下载脚本，并按仓库约定保存到 `stitch/screens/<screenName>/`。当用户要求“从 stitch 拉取设计稿”“保存设计稿资源”“归档 screen 截图/HTML”“把设计稿落到 stitch/screens”时使用。
---

按项目既有规范把 Stitch 设计稿保存到仓库，不要临时散落到别的目录。

## 目标

对每个 Stitch screen 产出以下文件：

- `stitch/screens/<featureName>/`
- `<featureName>.png`
- `<featureName>.html`
- `metadata.json`
- `download_with_curl.ps1`

如有需要，更新 `stitch/README.md` 里的“当前已整理资源”。

## 工作流

1. 先用 Stitch MCP 获取 screen 信息：
   - `list_projects`
   - `list_screens`
   - `get_screen`
2. 确认保存目录名：
   - 优先使用简洁、稳定的业务名
   - 中英文混合目录名可保留现有风格，例如 `商品详情 (Product Detail)`
   - 如果 screen 标题里带临时说明，如“已移除按钮”，不要直接塞进目录名；把完整标题写进 `metadata.json`
3. 保存资源到 `stitch/screens/<featureName>/`
4. 下载截图和 HTML 导出
5. 写 `metadata.json`
6. 生成 `download_with_curl.ps1`
7. 如该页面是新增归档，更新 `stitch/README.md`

## metadata.json 结构

严格使用以下结构：

```json
{
  "project": {
    "id": "11131971736005700711",
    "title": "首页 (Home)"
  },
  "screen": {
    "id": "screen_id",
    "title": "screen title",
    "width": "780",
    "height": "2722",
    "deviceType": "MOBILE"
  },
  "downloads": {
    "screenshot": {
      "url": "https://...",
      "contentType": "image/png",
      "file": "stitch/screens/<featureName>/<featureName>.png"
    },
    "code": {
      "url": "https://...",
      "contentType": "text/html",
      "file": "stitch/screens/<featureName>/<featureName>.html"
    }
  }
}
```

## download_with_curl.ps1 规则

- 用 `curl.exe -L`
- 文件名必须和目录内实际文件一致
- 先下载 PNG，再下载 HTML
- 第一行写简短注释，格式参考现有 screen 目录

## 目录命名规则

- 尽量与现有归档风格一致
- 避免把一次性设计说明直接放进目录名
- 如果用户没有指定目录名，用“中文业务名 + 英文括注”的格式

## 校验清单

完成后检查：

- 目录下 4 个核心文件是否齐全
- `metadata.json` 中 `file` 路径是否和实际路径一致
- `download_with_curl.ps1` 能否用于重下同一份资源
- `stitch/README.md` 是否追加了新归档记录

需要示例时，参考 [archive-format.md](references/archive-format.md)。
