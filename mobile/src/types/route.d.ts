import type { GlobalStyle } from '@uni-helper/vite-plugin-uni-pages'
import type { CSSProperties } from 'vue'

interface BaseNavbar {
  rootStyle?: CSSProperties
  iconColor?: string
  iconSize?: string
  titleStyle?: CSSProperties
  type?: 'default' | 'inner'
}

// 扩展 Route 接口，添加 style 属性支持
declare module 'uni-mini-router' {
  interface Route {
    style?: GlobalStyle
    baseLayout?: {
      rootStyle?: CSSProperties
    }
    baseNavbar?: BaseNavbar
  }

}
declare module '@uni-helper/vite-plugin-uni-pages' {
  interface PageMetaDatum {
    baseLayout?: {
      rootStyle?: CSSProperties
    }
    baseNavbar?: BaseNavbar
  }
}
