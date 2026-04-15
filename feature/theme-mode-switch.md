# 主题模式切换功能

## 功能概述

实现支持三种模式的主题切换系统：
- **light**: 强制亮色模式
- **dark**: 强制暗色模式
- **auto**: 跟随操作系统主题

同时支持灰度模式和色弱模式辅助功能。

---

## 核心机制

### 三层颜色控制架构

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: CSS 变量 (最底层)                              │
│  --primary-color, --base-text-color, --container-bg     │
│  在 :root 和 html.dark 下定义不同的值                      │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Tailwind 工具类 (中间层)                        │
│  bg-primary, text-base-text, bg-container               │
│  通过 tailwind.config.js 映射到 CSS 变量                  │
├─────────────────────────────────────────────────────────┤
│  Layer 3: 组件/页面样式 (应用层)                          │
│  使用工具类或自定义样式                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 文件结构

```
frontend/src/
├── types/
│   ├── theme.d.ts              # 主题类型定义
│   └── naive-ui.d.ts           # Naive UI 类型定义
├── utils/
│   ├── storage.ts              # localStorage 封装
│   └── common.ts               # toggleHtmlClass 工具
├── constants/
│   └── app.ts                  # DARK_CLASS 常量
├── theme/
│   └── settings.ts             # 默认主题配置
├── store/modules/theme/
│   ├── index.ts                # Theme Pinia Store
│   └── shared.ts               # 主题工具函数
├── components/common/
│   └── ThemeSchemaSwitch.vue   # 主题切换按钮组件
└── App.vue                     # NConfigProvider 配置
```

---

## 配置说明

### 1. 主题配置 (theme/settings.ts)

```typescript
export const themeSettings: App.Theme.ThemeSetting = {
  themeScheme: 'light',           // 默认模式
  grayscale: false,               // 灰度模式
  colourWeakness: false,          // 色弱模式
  themeColor: '#18A058',          // 主题色
  otherColor: {
    info: '#2080F0',
    success: '#18A058',
    warning: '#F0A020',
    error: '#D03050'
  },
  tokens: {
    light: {
      colors: {
        container: '255 255 255',
        layout: '247 250 252',
        inverted: '0 20 40',
        'base-text': '31 31 31'
      },
      boxShadow: {
        header: '0 1px 2px rgb(0, 21, 41, 0.08)',
        sider: '2px 0 8px 0 rgb(29, 35, 41, 0.05)',
        tab: '0 1px 2px rgb(0, 21, 41, 0.08)'
      }
    },
    dark: {
      colors: {
        container: '28 28 28',
        layout: '18 18 18',
        inverted: '0 20 40',
        'base-text': '224 224 224'
      },
      boxShadow: {
        header: '0 1px 2px rgb(0, 0, 0, 0.2)',
        sider: '2px 0 8px 0 rgb(0, 0, 0, 0.3)',
        tab: '0 1px 2px rgb(0, 0, 0, 0.2)'
      }
    }
  }
};
```

### 2. Tailwind 配置 (tailwind.config.js)

```javascript
export default {
  darkMode: 'class',  // 使用 class 策略
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary-color))',
          50: 'rgb(var(--primary-50-color))',
          // ... 100-900
        },
        info: 'rgb(var(--info-color))',
        success: 'rgb(var(--success-color))',
        warning: 'rgb(var(--warning-color))',
        error: 'rgb(var(--error-color))',
        container: 'rgb(var(--container-bg-color))',
        layout: 'rgb(var(--layout-bg-color))',
        'base-text': 'rgb(var(--base-text-color))',
      },
      boxShadow: {
        'header': 'var(--header-box-shadow)',
        'sider': 'var(--sider-box-shadow)',
        'tab': 'var(--tab-box-shadow)',
      },
    },
  },
}
```

---

## 使用方式

### 在模板中使用

```vue
<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme';

const themeStore = useThemeStore();
</script>

<template>
  <!-- 主题切换按钮 -->
  <ThemeSchemaSwitch 
    :theme-scheme="themeStore.themeScheme"
    @switch="themeStore.toggleThemeScheme"
  />
  
  <!-- 使用 Tailwind 主题类 -->
  <div class="bg-layout text-base-text">
    <div class="bg-container shadow-header">
      <span class="text-primary">主题色文字</span>
    </div>
  </div>
  
  <!-- Naive UI 组件自动适配 -->
  <n-tag type="success">成功标签</n-tag>
  <n-button type="primary">主题按钮</n-button>
</template>
```

### 编程方式切换

```typescript
const themeStore = useThemeStore();

// 设置指定模式
themeStore.setThemeScheme('dark');

// 循环切换 (light -> dark -> auto)
themeStore.toggleThemeScheme();

// 开启灰度模式
themeStore.setGrayscale(true);

// 开启色弱模式
themeStore.setColourWeakness(true);
```

---

## 切换流程

```
用户点击切换按钮
        ↓
toggleThemeScheme() 更新 themeScheme
        ↓
darkMode 计算属性重新计算
        ↓
触发 watch → toggleCssDarkMode()
        ↓
<html> 添加/移除 dark 类
        ↓
CSS 变量切换 (自动)
        ↓
Tailwind 类名响应 (自动)
        ↓
Naive UI 检测 :theme 变化 (自动)
        ↓
页面颜色更新完成
```

---

## Naive UI 集成

### App.vue 配置

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { darkTheme } from 'naive-ui';
import { useThemeStore } from '@/store/modules/theme';

const themeStore = useThemeStore();

const naiveDarkTheme = computed(() => 
  themeStore.darkMode ? darkTheme : undefined
);

const naiveThemeOverrides = computed(() => 
  themeStore.naiveTheme
);
</script>

<template>
  <n-config-provider
    :theme="naiveDarkTheme"
    :theme-overrides="naiveThemeOverrides"
  >
    <router-view />
  </n-config-provider>
</template>
```

### 主题覆盖配置

| 组件 | 配置内容 |
|------|----------|
| common | 颜色色阶（Hover/Pressed/Active）、圆角 6px |
| LoadingBar | 加载条颜色使用主题色 |
| Tag | 标签圆角 6px |
| Button | 主色按钮文字强制白色 |
| Card/Modal/Drawer | 圆角 8px |
| Input/Select | 圆角 6px |

---

## 样式规范

### 推荐做法 ✅

```vue
<!-- 使用主题类名 -->
<div class="bg-layout text-base-text">
<div class="bg-container shadow-header">
<span class="text-primary">

<!-- 使用 dark: 前缀 -->
<div class="bg-white dark:bg-gray-800">
<span class="text-gray-800 dark:text-gray-200">

<!-- Naive UI 使用 type 属性 -->
<n-tag type="success">
<n-button type="primary">
```

### 避免做法 ❌

```vue
<!-- 不要写死颜色值 -->
<div class="bg-white text-black">

<!-- 不要直接覆盖全局样式 -->
<style>
.n-tag { color: red; }
</style>
```

---

## 调试技巧

浏览器控制台查看当前 CSS 变量：

```javascript
// 获取主题相关的 CSS 变量
const styles = getComputedStyle(document.documentElement);
console.log('主色:', styles.getPropertyValue('--primary-color'));
console.log('文字色:', styles.getPropertyValue('--base-text-color'));
console.log('背景色:', styles.getPropertyValue('--container-bg-color'));
```

---

## 依赖项

```json
{
  "dependencies": {
    "vue": "^3.4.21",
    "pinia": "^2.1.7",
    "naive-ui": "^2.38.0",
    "@vueuse/core": "^14.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1"
  }
}
```

---

## 注意事项

1. **CSS 变量格式**：使用 RGB 分量格式（如 `255 255 255`），不要带 `rgb()` 包裹
2. **初始化时机**：在 `main.ts` 中调用 `themeStore.init()` 确保 CSS 变量先设置
3. **持久化**：主题设置自动缓存到 localStorage，页面刷新后恢复
4. **暗色模式**：通过 `html.dark` 类控制，Tailwind 和 CSS 变量同时响应
5. **Naive UI**：通过 `NConfigProvider` 的 `:theme` 和 `:theme-overrides` 配置
