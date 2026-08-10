import { computed } from 'vue';
import { useDesignSettingStore } from '@/store/modules/designSetting';

export function useDesignSetting() {
  const designStore = useDesignSettingStore();

  const getDarkTheme = computed(() => designStore.darkTheme);
  const getAppTheme = computed(() => designStore.appTheme);
  const getAppThemeList = computed(() => designStore.appThemeList);
  const getFollowSystem = computed(() => designStore.followSystem);
  const getGrayMode = computed(() => designStore.grayMode);
  const getColorWeak = computed(() => designStore.colorWeak);
  const getBorderRadius = computed(() => designStore.borderRadius);
  const getCompact = computed(() => designStore.compact);

  return {
    getDarkTheme,
    getAppTheme,
    getAppThemeList,
    getFollowSystem,
    getGrayMode,
    getColorWeak,
    getBorderRadius,
    getCompact,
  };
}
