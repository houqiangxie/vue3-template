const setting = {
  // 导航模式 vertical 左侧菜单模式 horizontal 顶部菜单模式 horizontal-mix 混合模式
  navMode: 'vertical',
  // 导航风格 dark 暗色侧边栏 light 白色侧边栏 header-dark 暗色顶栏
  navTheme: 'dark',
  // 是否处于移动端模式
  isMobile: false,
  // 是否显示 Logo
  showLogo: true,
  // 界面语言
  locale: 'zh-CN' as 'zh-CN' | 'en-US',
  // 顶部设置
  headerSetting: {
    bgColor: '#ffffff',
    fixed: true,
    isReload: true,
    showFullscreen: true,
    showUserInfo: true,
  },
  // 弹窗
  modalSetting: {
    // 顶部背景色；默认白，深色主题下视为跟随主题
    headerBgColor: '#ffffff',
  },
  // 页脚
  showFooter: false,
  // 多标签
  multiTabsSetting: {
    bgColor: '#ffffff',
    show: true,
    fixed: true,
    // card 卡片 | simple 极简 | dot 圆点
    style: 'card' as 'card' | 'simple' | 'dot',
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
    trigger: 'click' as 'click' | 'hover',
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
  // 权限模式 FIXED | BACKEND
  permissionMode: 'FIXED',
  // 是否开启路由动画
  isPageAnimate: true,
  // 路由动画类型
  pageAnimateType: 'zoom-fade',
};

export default setting;
