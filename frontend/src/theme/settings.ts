/** 默认主题配置 */
export const themeSettings: App.Theme.ThemeSetting = {
  themeScheme: 'light',
  grayscale: false,
  colourWeakness: false,
  themeColor: '#18A058',
  otherColor: {
    info: '#2080F0',
    success: '#18A058',
    warning: '#F0A020',
    error: '#D03050'
  },
  tokens: {
    light: {
      colors: {
        // 使用 RGB 分量格式，便于在 CSS 中使用 rgb(var(--xxx))
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

/** 主题色板生成配置 */
export const colorPaletteConfig = {
  // 主题色生成的色阶
  primaryLevels: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
};
