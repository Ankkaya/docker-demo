---
title: 刷新列表高度计算
---

# 刷新列表高度计算

本文整理当前商城移动端搜索页中，`PullLoadContainer` 刷新列表容器的高度计算方式，目标是把以下几层关系写清楚：

- 页面总可用高度怎么来
- 顶部搜索输入区占了多少
- 剩余滚动区高度怎么计算
- `PullLoadContainer` 为什么只需要吃满父容器
- 下拉刷新头部高度和内容位移之间是什么关系

## 适用范围

当前文档对应以下实现：

- 搜索页 [search/index.vue](/C:/project/docker-demo/mobile/src/pages/search/index.vue)
- 下拉刷新容器 [PullLoadContainer.vue](/C:/project/docker-demo/mobile/src/components/common/PullLoadContainer.vue)

## 页面高度拆分

搜索页整体高度由三部分组成：

```text
页面滚动可用高度
= 视口高度
- 顶部安全区和自定义导航占位高度
- 底部安全区高度
```

对应代码：

```ts
const { topAreaHeight, safeAreaInsetsBottom } = usePlatform()

const pageContentHeight = computed(() => {
  return `calc(100vh - ${topAreaHeight}px - ${safeAreaInsetsBottom}px)`
})
```

这里的含义是：

- `100vh`
  当前页面视口高度
- `topAreaHeight`
  自定义导航模式下，顶部状态栏和导航占位的总高度
- `safeAreaInsetsBottom`
  底部安全区高度，主要用于全面屏设备

页面根节点直接使用这个高度：

```vue
<view class="flex flex-col bg-[#f8f7f6]" :style="{ height: pageContentHeight }">
```

这一步的作用是先把“真正能用来排内容的页面高度”固定下来。

## 顶部搜索栏高度

搜索页没有再用模糊的视觉估算值，而是把输入区高度拆成明确常量：

```ts
const SEARCH_BAR_INPUT_HEIGHT = 44
const SEARCH_BAR_VERTICAL_PADDING = 32
const SEARCH_BAR_TOTAL_HEIGHT = SEARCH_BAR_INPUT_HEIGHT + SEARCH_BAR_VERTICAL_PADDING
```

当前实际含义：

- `SEARCH_BAR_INPUT_HEIGHT = 44`
  搜索输入框容器高度
- `SEARCH_BAR_VERTICAL_PADDING = 32`
  顶部搜索栏上下内边距总和
- `SEARCH_BAR_TOTAL_HEIGHT = 76`
  顶部搜索栏整体占用高度

搜索框容器本身也绑定了这个常量：

```vue
<view
  class="flex flex-1 items-center border border-[#efb239]/10 rounded-xl bg-[#f1f5f9] shadow-sm"
  :style="{ height: `${SEARCH_BAR_INPUT_HEIGHT}px` }"
>
```

这样做的意义是：

- 输入框视觉高度和计算高度是一致的
- 后续如果要改输入框高度，不需要再手改多个魔法值

## 结果列表滚动区高度

顶部搜索栏高度确定后，剩余滚动区域高度就是：

```text
结果列表滚动区高度
= 页面总可用高度
- 顶部搜索栏总高度
```

对应代码：

```ts
const resultAreaStyle = computed(() => ({
  height: `calc(${pageContentHeight.value} - ${SEARCH_BAR_TOTAL_HEIGHT}px)`,
}))
```

展开后可以理解成：

```text
结果列表滚动区高度
= 100vh
- topAreaHeight
- safeAreaInsetsBottom
- 76px
```

搜索页初始态和结果态都使用这段高度：

```vue
<view v-if="isSearching" class="flex-1 overflow-hidden" :style="resultAreaStyle">
```

```vue
<view v-else class="flex-1 px-4 py-2 overflow-y-auto" :style="resultAreaStyle">
```

这样可以保证两种页面状态切换时，滚动区高度模型一致，不会因为状态切换出现跳动。

## PullLoadContainer 的高度职责

`PullLoadContainer` 自己不负责算屏幕还剩多少高度，它只做一件事：吃满父容器。

对应样式：

```scss
.pull-load-container {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.pull-load-scroll {
  position: relative;
  z-index: 2;
  height: 100%;
}
```

这意味着：

- 页面层负责给它一个确定的高度
- 组件层只在这个确定高度里处理滚动、下拉、回弹和上拉加载

也就是说，职责边界是：

- 页面负责“算多高”
- 容器负责“在这块高度里怎么滚”

## 下拉刷新头部高度

当前刷新头部区域也已经固定成显式高度，而不是靠一整块隐藏头部慢慢滑出。

组件默认值：

```ts
refreshThreshold: 44,
refreshHoldDistance: 44,
headerVisibleHeight: 44,
```

这 3 个值当前是对齐的：

- `headerVisibleHeight = 44`
  顶部提示容器的可视高度
- `refreshHoldDistance = 44`
  松手触发刷新后，内容保持下移的距离
- `refreshThreshold = 44`
  触发刷新的阈值

这样当前模型是：

```text
拉到头部提示区完整露出
≈ 到达刷新阈值
≈ 触发刷新后保留的下移距离
```

这个设计有两个直接好处：

- 用户不需要额外拉很远才触发刷新
- 刷新中的提示区域高度刚好等于顶部加载区域高度

## 顶部加载区与内容位移关系

刷新容器里有两个关键位移：

1. 内容区位移

```ts
const contentOffset = computed(() => (
  isRefreshing.value ? props.refreshHoldDistance : pullDistance.value
))
```

2. 头部提示区位移

```ts
const headerOffset = computed(() => (
  isRefreshing.value ? 0 : contentOffset.value - headerVisibleHeightPx.value
))
```

它们的关系可以理解成：

- 内容整体往下移动 `contentOffset`
- 头部容器从顶部往下露出，露出高度由 `contentOffset` 决定
- 当 `contentOffset = headerVisibleHeight` 时，整个头部提示区刚好完全显示

当前头部样式：

```ts
const headerStyle = computed(() => ({
  height: `${headerVisibleHeightPx.value}px`,
  transform: `translateY(${headerOffset.value}px)`,
  transition: animated.value ? 'transform 220ms ease, opacity 220ms ease' : 'none',
  opacity: contentOffset.value > 0 || isRefreshing.value ? 1 : 0,
}))
```

因此头部加载区的视觉行为是：

- 初始时完全藏在顶部
- 下拉时从顶部逐步露出
- 释放并触发刷新后，固定停在顶部
- 内容区保持下移 `44px`
- 请求完成后延迟 1 秒再恢复

## 当前搜索页的完整高度公式

把页面和容器两层逻辑合起来，当前搜索页可以总结为：

```text
页面根容器高度
= 100vh - topAreaHeight - safeAreaInsetsBottom

结果区高度
= 页面根容器高度 - SEARCH_BAR_TOTAL_HEIGHT

PullLoadContainer 高度
= 结果区高度

刷新中内容保留下移距离
= refreshHoldDistance
= 44px

顶部提示容器高度
= headerVisibleHeight
= 44px
```

## 为什么不让 PullLoadContainer 自己算高度

不建议把“视口高度减导航减安全区减搜索栏”这样的逻辑写进 `PullLoadContainer`，原因有三点：

- 组件应该保持通用，只关心滚动交互，不关心具体页面结构
- 不同页面顶部占位不一样，统一写进组件反而会让耦合更高
- 页面自己管理高度时，更容易精确控制输入框、筛选栏、顶部标题栏等固定区域

所以目前的设计原则是：

- 页面层做布局减法
- 刷新容器只负责滚动和刷新交互

## 新页面复用建议

如果后面还有页面要复用这个刷新容器，建议按下面顺序计算：

1. 先确定页面总可用高度

```ts
const pageContentHeight = computed(() => {
  return `calc(100vh - ${topAreaHeight}px - ${safeAreaInsetsBottom}px)`
})
```

2. 明确列出所有顶部固定区高度

例如：

```ts
const SEARCH_BAR_HEIGHT = 76
const FILTER_BAR_HEIGHT = 48
const HEADER_SUMMARY_HEIGHT = 40
```

3. 用统一公式算滚动区

```ts
const listAreaStyle = computed(() => ({
  height: `calc(${pageContentHeight.value} - ${SEARCH_BAR_HEIGHT + FILTER_BAR_HEIGHT + HEADER_SUMMARY_HEIGHT}px)`,
}))
```

4. 把 `PullLoadContainer` 放进这个滚动区里，并保持 `height: 100%`

这样会比一边写 `flex-1` 一边混入多个隐式高度更稳定。

## 当前常量建议

如果后续继续维护搜索页，建议优先保持以下常量显式化：

- `SEARCH_BAR_INPUT_HEIGHT`
- `SEARCH_BAR_VERTICAL_PADDING`
- `SEARCH_BAR_TOTAL_HEIGHT`
- `refreshThreshold`
- `refreshHoldDistance`
- `headerVisibleHeight`

这些值一旦改动，应该同时检查：

- 输入框视觉高度是否同步
- 结果区高度是否仍然准确
- 下拉提示区是否完整显示
- 刷新时顶部保留区域是否过大或过小

