<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="getDarkTheme ? darkTheme : lightTheme"
    :theme-overrides="themeOverrides"
  >
    <n-dialog-provider>
      <n-message-provider>
        <RegisterMessage />
        <n-spin :show="commonStore.showLoading">
          <router-view />
        </n-spin>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { lightTheme, darkTheme, zhCN, dateZhCN } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import { useCommonStore } from '@/store/common';
import { useDesignSettingStore } from '@/store/modules/designSetting';
import { useProjectSettingStore } from '@/store/modules/projectSetting';
import { lighten } from '@/utils/layout';

const commonStore = useCommonStore();
const designStore = useDesignSettingStore();

const getDarkTheme = computed(() => designStore.darkTheme);

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const appTheme = designStore.appTheme;
  const lightenStr = lighten(appTheme, 6);
  return {
    common: {
      primaryColor: appTheme,
      primaryColorHover: lightenStr,
      primaryColorPressed: lightenStr,
      primaryColorSuppl: appTheme,
    },
  };
});

// 订阅 projectSetting 变化并持久化
const projectStore = useProjectSettingStore();
projectStore.$subscribe((_mutation, state) => {
  try {
    localStorage.setItem('__project_setting__', JSON.stringify({
      navMode: state.navMode,
      navTheme: state.navTheme,
      headerSetting: state.headerSetting,
      menuSetting: state.menuSetting,
      multiTabsSetting: state.multiTabsSetting,
      crumbsSetting: state.crumbsSetting,
      isPageAnimate: state.isPageAnimate,
      pageAnimateType: state.pageAnimateType,
    }));
  } catch {}
}, { detached: true });

// 订阅 designSetting 变化并持久化
designStore.$subscribe((_mutation, state) => {
  try {
    localStorage.setItem('__design_setting__', JSON.stringify({
      darkTheme: state.darkTheme,
      appTheme: state.appTheme,
    }));
  } catch {}
}, { detached: true });
</script>

<style lang="scss">
.n-spin-content {
  opacity: 1 !important;
}
.n-scrollbar-rail__scrollbar {
  z-index: 999;
}

::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: #aaa;
}
::-webkit-scrollbar-track {
  border-radius: 0;
  background: rgba(0, 0, 0, 0);
}
</style>
