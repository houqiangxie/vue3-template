import type { AppLocale } from '@/i18n/types';
import type { PageAnimateType } from '@/settings/animateSetting';

export type NavMode = 'vertical' | 'horizontal' | 'horizontal-mix';
export type NavTheme = 'dark' | 'light' | 'header-dark';
export type TabsStyle = 'card' | 'simple' | 'dot';
export type MenuTrigger = 'click' | 'hover';
export type LayoutPreset = 'classic' | 'topNav' | 'minimal';

/** 内容区最大宽度上限（与设置面板 slider 一致） */
export const CONTENT_MAX_WIDTH = 1600;

const setting = {
  // 导航模式 vertical 左侧菜单模式 horizontal 顶部菜单模式 horizontal-mix 混合模式
  navMode: 'vertical' as NavMode,
  // 导航风格 dark 暗色侧边栏 light 白色侧边栏 header-dark 暗色顶栏
  navTheme: 'dark' as NavTheme,
  /** 进入深色主题前记住的浅色导航风格，用于切回浅色时恢复 */
  lastLightNavTheme: 'dark' as NavTheme,
  // 是否处于移动端模式（运行时，不持久化）
  isMobile: false,
  // 是否显示 Logo
  showLogo: true,
  // 界面语言
  locale: 'zh-CN' as AppLocale,
  // 顶部设置
  headerSetting: {
    bgColor: '#ffffff',
    /** true = 跟随主题；false = 使用 bgColor */
    bgFollowTheme: true,
    fixed: true,
    isReload: true,
    showFullscreen: true,
    showUserInfo: true,
    showSearch: true,
    showNotice: true,
    showLocale: true,
  },
  // 弹窗
  modalSetting: {
    headerBgColor: '#ffffff',
    bgFollowTheme: true,
  },
  // 页脚
  showFooter: false,
  footerText: '',
  // 内容区
  contentSetting: {
    padding: 10,
    /** 0 = 不限制宽度 */
    maxWidth: 0,
  },
  // 多标签
  multiTabsSetting: {
    bgColor: '#ffffff',
    bgFollowTheme: true,
    show: true,
    fixed: true,
    // card 卡片 | simple 极简 | dot 圆点
    style: 'card' as TabsStyle,
    showContextMenu: true,
    persist: true,
  },
  // 菜单
  menuSetting: {
    minMenuWidth: 64,
    menuWidth: 200,
    fixed: true,
    mixMenu: false,
    collapsed: false,
    // 手风琴：同时只展开一个子菜单
    accordion: false,
    // 触发移动端侧边栏的宽度
    mobileWidth: 800,
    // 折叠态展开方式 click | hover
    trigger: 'click' as MenuTrigger,
  },
  // 面包屑
  crumbsSetting: {
    show: true,
    showIcon: false,
  },
  // 水印
  watermark: {
    show: false,
    text: '',
  },
  // 锁屏
  lockScreen: {
    enabled: false,
    // 空闲超时（分钟）
    timeout: 30,
  },
  // 是否开启路由动画
  isPageAnimate: true,
  // 遵循系统「减少动效」时自动关闭路由动画
  respectReducedMotion: true,
  // 路由动画类型
  pageAnimateType: 'zoom-fade' as PageAnimateType,
  /**
   * body.zoom 反向补偿系统/浏览器缩放（仅 Web）。
   * 例：devicePixelRatio=3 → zoom=1/3。浮层定位由 Vite 插件修正 vueuc。
   */
  bodyZoomCompensation: true,
};

export default setting;
