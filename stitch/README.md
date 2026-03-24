# Stitch Assets

统一管理 Stitch 导出产物与原始响应。

## 目录结构

- `screens/<featureName>/`
  - `<featureName>.png`: 页面截图
  - `<featureName>.html`: Stitch 导出的页面代码
  - `metadata.json`: 项目/页面元信息与下载来源
  - `download_with_curl.ps1`: 使用 `curl -L` 重新下载资源
- `raw/`
  - `project_raw.json`: `get_project` 原始响应
  - `list_screens_raw.json`: `list_screens` 原始响应
  - `get_screen_raw.json`: `get_screen` 原始响应

## 当前已整理资源

- 项目：`11131971736005700711`（首页 Home）
- 页面：`dd4902990e634bc28f938d998e49d1d4`（商品列表页 Product List）
- 功能目录：`商品列表页 (Product List)`
- 页面：`a4ee73ec800148c1ad15a75ce8ac4379`（商品评价列表）
- 功能目录：`商品评价列表 (Product Review List)`
