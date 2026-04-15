# 后台与小程序统一动态图标方案

## 背景

当前项目存在两套图标实现：

- 后台 `frontend` 主要使用 `@vicons/ionicons5`
- 小程序端 `mobile` 混用了 `wd-icon` 与 `UnoCSS + Iconify`

业务目标是：

- 后台可配置图标
- 配置完成后，后台与小程序都能显示相同图标
- 后台新增图标时，不依赖重新发版或扩充白名单

这意味着不能再把动态图标建立在编译期 class 方案上，例如：

- `tailwindcss + icones`
- `UnoCSS presetIcons + safelist`

原因是这类方案的 class 在构建后已固定，后台后续新增的图标不会自动出现在产物中。

## 结论

统一方案采用：

- 数据库存储 `Iconify ID`
- 服务端生成 SVG 文件
- 后台 Web 与小程序端统一通过 SVG URL 渲染

标准值示例：

```ts
icon = 'material-symbols:home-rounded'
```

不再以以下值作为统一协议：

- `i-material-symbols:home-rounded`
- `HomeOutline`
- `wd-icon` 的 `name`
- `setting`、`warehouse` 之类的前端业务映射 key

## 方案选型依据

2026-03-13 查询微信开放文档后，结论如下：

1. 微信小程序 `image` 组件支持 SVG
   - 官方文档说明 `image` 支持 `JPG、PNG、SVG、WEBP、GIF`
   - 但 SVG 有限制：
   - 不支持百分比单位
   - 不支持 `<style>` 元素
   - `mode=scaleToFill` 时，WebView 与 Skyline 表现存在差异

2. `rich-text` 不适合作为通用 SVG 渲染方案
   - 文档中受信任节点包含 `img`
   - 未将 `svg` 作为可靠渲染节点
   - 不受信任节点会被移除

3. 原生 `icon` 组件不适合业务动态图标
   - 仅支持有限的固定 type

官方文档：

- `image`: https://developers.weixin.qq.com/miniprogram/dev/component/image.html
- `rich-text`: https://developers.weixin.qq.com/miniprogram/dev/component/rich-text.html
- `icon`: https://developers.weixin.qq.com/miniprogram/dev/component/icon.html

因此，小程序侧最稳的落地方式是：

- 使用 `<image src="svg-url" />` 渲染图标

## 统一协议

### 数据库字段

建议为菜单、分类、商城导航等“业务可配置图标”增加以下字段：

```ts
icon: string | null
iconUrl: string | null
```

字段语义：

- `icon`: 存储 `Iconify ID`
- `iconUrl`: 存储服务端生成后的 SVG 文件访问地址

示例：

```json
{
  "icon": "material-symbols:shopping-cart-outline",
  "iconUrl": "/api/files/preview?filename=icons/material-symbols-shopping-cart-outline.svg"
}
```

如后续需要支持缓存校验，可继续补充：

```ts
iconVersion: string | null
```

## 服务端职责

### 核心职责

当后台保存图标时，服务端负责：

1. 校验 `Iconify ID` 合法性
2. 根据 `Iconify ID` 获取 SVG 内容
3. 对 SVG 做安全与兼容处理
4. 上传到 MinIO
5. 将 `icon` 与 `iconUrl` 一并保存

### SVG 处理规则

为了兼容小程序 `image` 组件，生成 SVG 时必须约束：

1. 去掉 `<style>` 元素
2. 不使用百分比尺寸
3. 强制输出固定 `viewBox`
4. 允许使用 `currentColor` 的场景需谨慎
   - 小程序 `image` 渲染无法像内联 SVG 一样直接继承 CSS `color`
   - 推荐服务端直接输出固定颜色，或提供多色版本

建议默认输出：

- 单色图标
- `width="24" height="24"`
- 保留 `viewBox`

### 存储路径规范

建议图标统一存储到 MinIO：

```text
icons/{collection}/{icon-name}.svg
```

示例：

```text
icons/material-symbols/home-rounded.svg
icons/mdi/warehouse-outline.svg
```

如果需要规避重名或支持版本升级，可使用：

```text
icons/{collection}/{icon-name}-{hash}.svg
```

## 后台 Web 渲染方案

后台不再将动态图标映射为 Vue 组件，而是统一走 `AppIcon` 组件。

### 组件接口

```ts
interface AppIconProps {
  icon?: string
  iconUrl?: string
  size?: number | string
  alt?: string
}
```

### 渲染逻辑

优先级：

1. `iconUrl` 存在，直接渲染 `<img>`
2. `iconUrl` 为空时，显示默认占位图标

示例：

```vue
<img
  v-if="iconUrl"
  :src="iconUrl"
  :alt="alt || icon || 'icon'"
  :style="{ width: normalizeSize(size), height: normalizeSize(size) }"
/>
```

### 后台选择器

后台图标选择器不再返回 class 名，而返回：

```ts
{
  icon: 'material-symbols:home-rounded'
}
```

保存时由后端补全 `iconUrl`。

## 小程序端渲染方案

`mobile` 即微信小程序端，统一通过自定义 `AppIcon` 组件渲染。

### 组件接口

```ts
interface AppIconProps {
  icon?: string
  iconUrl?: string
  size?: string
  mode?: 'aspectFit' | 'widthFix' | 'heightFix'
}
```

### 推荐实现

```vue
<template>
  <image
    v-if="iconUrl"
    :src="iconUrl"
    :mode="mode || 'aspectFit'"
    :style="{
      width: size || '24px',
      height: size || '24px'
    }"
  />
  <view v-else class="app-icon__placeholder" />
</template>
```

### 小程序端约束

1. 不使用 `rich-text` 渲染 `<svg>`
2. 不依赖 `UnoCSS safelist` 生成动态图标
3. 不把 `wd-icon` 作为动态业务图标协议

`wd-icon` 仍可继续用于固定交互图标，例如：

- 返回
- 关闭
- 搜索
- 提示状态

但业务图标统一改为 `icon + iconUrl` 渲染。

## 接口约定

### 写入接口

请求：

```json
{
  "name": "商品分类",
  "icon": "material-symbols:category-rounded"
}
```

服务端处理后保存：

```json
{
  "icon": "material-symbols:category-rounded",
  "iconUrl": "/api/files/preview?filename=icons/material-symbols/category-rounded.svg"
}
```

### 读取接口

接口返回统一包含：

```json
{
  "id": 1,
  "name": "商品分类",
  "icon": "material-symbols:category-rounded",
  "iconUrl": "/api/files/preview?filename=icons/material-symbols/category-rounded.svg"
}
```

## 对现有模块的影响

### 后台

需要改造：

- 菜单管理
- 商品分类
- 后续所有带图标配置的业务模块

需要移除或逐步废弃：

- 现有字符串到 `@vicons/ionicons5` 的 `iconMap`
- 把数据库中的业务 key 映射为组件的旧逻辑

### 小程序

需要改造：

- Tabbar 图标
- 分类页图标
- 个人中心入口图标
- 后续所有后台可配置业务图标

保留：

- `wd-icon` 作为固定 UI 图标

## 迁移策略

### 第一阶段：双轨兼容

保留旧字段逻辑，同时新增：

- `icon`
- `iconUrl`

前端渲染优先级：

1. 有 `iconUrl`，使用 SVG
2. 无 `iconUrl`，回退旧图标逻辑

### 第二阶段：批量迁移

对已有菜单、分类等数据做批量转换：

1. 将旧 key 转为 `Iconify ID`
2. 批量生成 SVG 文件
3. 写回 `iconUrl`

### 第三阶段：移除旧方案

删除：

- 后台旧 `iconMap`
- 小程序旧业务动态图标 class 逻辑

保留：

- 固定交互用的本地图标方案

## 建议的后端实现方式

推荐新增独立图标服务模块，例如：

```text
backend/src/icon-assets/
```

模块职责：

- `resolveIconSvg(iconifyId: string): Promise<string>`
- `storeIconSvg(iconifyId: string, svg: string): Promise<string>`
- `ensureIconAsset(iconifyId: string): Promise<{ icon: string; iconUrl: string }>`

同时为菜单、分类等业务服务提供统一调用入口。

## 风险与注意事项

1. SVG 安全
   - 必须在服务端过滤危险内容
   - 不允许直接信任外部原始 SVG

2. 图标颜色
   - 小程序 `image` 无法像内联 SVG 一样自然继承文字色
   - 若要求动态换色，需要服务端生成不同颜色版本，或增加参数生成机制

3. 网络与缓存
   - 图标 URL 建议走同域代理或 MinIO 代理地址
   - 避免小程序对跨域或下载域名配置产生额外限制

4. 包体与构建
   - 本方案不依赖构建期图标白名单
   - 不会因为后台新增图标而要求重新发布前端

## 推荐实施顺序

1. 后端增加图标资产服务模块
2. 菜单与分类模型增加 `iconUrl`
3. 后台图标选择器改为保存 `Iconify ID`
4. 后端保存时自动生成并存储 SVG
5. 后台 `frontend` 增加统一 `AppIcon`
6. 小程序 `mobile` 增加统一 `AppIcon`
7. 先改“商品分类”和“菜单管理”
8. 再逐步替换商城、小程序 tabbar 等模块

## 最终方案摘要

本项目的统一动态图标方案定为：

- 协议层：`Iconify ID`
- 资产层：服务端生成 SVG 文件
- 后台 Web：通过 `img` 渲染 `iconUrl`
- 小程序端：通过 `<image>` 渲染 `iconUrl`
- 固定交互图标：保留现有本地方案，不纳入后台动态配置范围

这套方案满足以下目标：

- 后台新增图标后可立即生效
- 后台和小程序显示一致
- 不依赖构建期白名单
- 不与具体前端框架强耦合
