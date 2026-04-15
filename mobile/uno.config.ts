import { presetUni } from '@uni-helper/unocss-preset-uni'

import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  safelist: [
    'i-material-symbols:house',
    'i-material-symbols:category-rounded',
    'i-material-symbols:shopping-cart',
    'i-material-symbols:account-circle',
  ],
  theme: {
    colors: {
      // 统一 text-primary / bg-primary 到主题色变量（$-color-theme 对应运行时变量）
      primary: 'var(--wot-color-theme)',
    },
  },
  presets: [
    presetUni({
      attributify: false,
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
      // 显式注册图标集，避免在部分 Uni/HBuilderX 环境下动态类图标不生效
      collections: {
        'carbon': () => import('@iconify-json/carbon/icons.json').then(i => i.default),
        'material-symbols': () => import('@iconify-json/material-symbols/icons.json').then(i => i.default),
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
