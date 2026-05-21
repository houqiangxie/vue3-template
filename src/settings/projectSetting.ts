const setting = {
  // 导航模式 vertical 左侧菜单模式 horizontal 顶部菜单模式 horizontal-mix 混合模式
  navMode: 'vertical',
  // 导航风格 dark 暗色侧边栏 light 白色侧边栏 header-dark 暗色顶栏
  navTheme: 'dark',
  // 是否处于移动端模式
  isMobile: false,
  // 顶部设置
  headerSetting: {
    bgColor: '#fff',
    fixed: true,
    isReload: true,
  },
  // 页脚
  showFooter: false,
  // 多标签
  multiTabsSetting: {
    bgColor: '#fff',
    show: true,
    fixed: true,
  },
  // 菜单
  menuSetting: {
    minMenuWidth: 64,
    menuWidth: 200,
    fixed: true,
    mixMenu: false,
    mobileWidth: 800,
    collapsed: false,
  },
  // 面包屑
  crumbsSetting: {
    show: true,
    showIcon: false,
  },
  // 权限模式
  permissionMode: 'FIXED',
  // 是否开启路由动画
  isPageAnimate: true,
  // 路由动画类型
  pageAnimateType: 'zoom-fade',
};

export default setting;
