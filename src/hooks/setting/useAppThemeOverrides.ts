import { computed } from 'vue';
import type { GlobalThemeOverrides } from 'naive-ui';
import {
  buildDesignThemeOverrides,
  deepMergeThemeOverrides,
} from '@/utils/theme';

/**
 * 合并项目配置主题与 NThemeEditor 持久化覆盖。
 * 编辑器打开时由其内部 ConfigProvider 负责覆盖，避免与 Clear All 冲突。
 * 关闭编辑器时的 storage 同步由 designStore.setShowThemeEditor 负责。
 */
export function useAppThemeOverrides() {
  const designStore = useDesignSettingStore();

  const themeOverrides = computed<GlobalThemeOverrides>(() => {
    const base = buildDesignThemeOverrides({
      appTheme: designStore.appTheme,
      borderRadius: designStore.borderRadius,
      compact: designStore.compact,
    });
    if (designStore.showThemeEditor) {
      return base;
    }
    return deepMergeThemeOverrides(base, designStore.themeEditorOverrides);
  });

  return {
    themeOverrides,
  };
}
