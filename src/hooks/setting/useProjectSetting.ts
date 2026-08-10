import { computed } from 'vue';
import { useProjectSettingStore } from '@/store/modules/projectSetting';

export function useProjectSetting() {
  const projectStore = useProjectSettingStore();

  const navMode = computed(() => projectStore.navMode);
  const navTheme = computed(() => projectStore.navTheme);
  const isMobile = computed(() => projectStore.isMobile);
  const showLogo = computed(() => projectStore.showLogo);
  const locale = computed(() => projectStore.locale);
  const headerSetting = computed(() => projectStore.headerSetting);
  const modalSetting = computed(() => projectStore.modalSetting);
  const multiTabsSetting = computed(() => projectStore.multiTabsSetting);
  const menuSetting = computed(() => projectStore.menuSetting);
  const crumbsSetting = computed(() => projectStore.crumbsSetting);
  const watermark = computed(() => projectStore.watermark);
  const lockScreen = computed(() => projectStore.lockScreen);
  const permissionMode = computed(() => projectStore.permissionMode);
  const showFooter = computed(() => projectStore.showFooter);
  const isPageAnimate = computed(() => projectStore.isPageAnimate);
  const pageAnimateType = computed(() => projectStore.pageAnimateType);

  return {
    navMode,
    navTheme,
    isMobile,
    showLogo,
    locale,
    headerSetting,
    modalSetting,
    multiTabsSetting,
    menuSetting,
    crumbsSetting,
    watermark,
    lockScreen,
    permissionMode,
    showFooter,
    isPageAnimate,
    pageAnimateType,
  };
}
