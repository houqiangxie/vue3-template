<template>
  <n-drawer v-model:show="isDrawer" :width="280" placement="right">
    <n-drawer-content title="项目配置" :native-scrollbar="false">
      <div class="drawer">

        <!-- 主题开关 -->
        <n-divider title-placement="center">主题</n-divider>
        <div class="drawer-setting-item justify-center dark-switch">
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-switch v-model:value="designStore.darkTheme" class="dark-theme-switch">
                <template #checked>
                  <n-icon size="14" color="#ffd93b"><SunnySharp /></n-icon>
                </template>
                <template #unchecked>
                  <n-icon size="14" color="#ffd93b"><Moon /></n-icon>
                </template>
              </n-switch>
            </template>
            <span>{{ designStore.darkTheme ? '深' : '浅' }}色主题</span>
          </n-tooltip>
        </div>

        <!-- 系统主题色 -->
        <n-divider title-placement="center">系统主题</n-divider>
        <div class="drawer-setting-item align-items-top">
          <span
            v-for="(item, index) in designStore.appThemeList"
            :key="index"
            class="theme-item"
            :style="{ backgroundColor: item }"
            @click="designStore.appTheme = item"
          >
            <n-icon v-if="item === designStore.appTheme" size="12">
              <CheckOutlined />
            </n-icon>
          </span>
        </div>

        <!-- 导航栏模式 -->
        <n-divider title-placement="center">导航栏模式</n-divider>
        <div class="drawer-setting-item align-items-top">
          <div class="drawer-setting-item-style">
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-theme-dark.svg" alt="左侧菜单" @click="togNavMode('vertical')" />
              </template>
              <span>左侧菜单模式</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-show="settingStore.navMode === 'vertical'" />
          </div>
          <div class="drawer-setting-item-style">
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-horizontal.svg" alt="顶部菜单" @click="togNavMode('horizontal')" />
              </template>
              <span>顶部菜单模式</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-show="settingStore.navMode === 'horizontal'" />
          </div>
          <div class="drawer-setting-item-style">
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-horizontal-mix.svg" alt="混合模式" @click="togNavMode('horizontal-mix')" />
              </template>
              <span>混合模式</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-show="settingStore.navMode === 'horizontal-mix'" />
          </div>
        </div>

        <!-- 导航栏风格 -->
        <n-divider title-placement="center">导航栏风格</n-divider>
        <div class="drawer-setting-item align-items-top">
          <div class="drawer-setting-item-style">
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-theme-dark.svg" alt="暗色侧边栏" @click="togNavTheme('dark')" />
              </template>
              <span>暗色侧边栏</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-if="settingStore.navTheme === 'dark'" />
          </div>
          <div class="drawer-setting-item-style">
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-theme-light.svg" alt="白色侧边栏" @click="togNavTheme('light')" />
              </template>
              <span>白色侧边栏</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-if="settingStore.navTheme === 'light'" />
          </div>
          <div class="drawer-setting-item-style">
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/header-theme-dark.svg" alt="暗色顶栏" @click="togNavTheme('header-dark')" />
              </template>
              <span>暗色顶栏</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-if="settingStore.navTheme === 'header-dark'" />
          </div>
        </div>

        <!-- 界面功能 -->
        <n-divider title-placement="center">界面功能</n-divider>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">固定顶栏</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.headerSetting.fixed" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">固定多页签</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.multiTabsSetting.fixed" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">分割菜单（混合模式）</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="settingStore.navMode !== 'horizontal-mix'"
              v-model:value="settingStore.menuSetting.mixMenu"
            />
          </div>
        </div>

        <!-- 界面显示 -->
        <n-divider title-placement="center">界面显示</n-divider>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示重载按钮</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.headerSetting.isReload" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示面包屑导航</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.crumbsSetting.show" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">面包屑显示图标</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.crumbsSetting.showIcon" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示多页签</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.multiTabsSetting.show" />
          </div>
        </div>

        <!-- 动画 -->
        <n-divider title-placement="center">动画</n-divider>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">启用动画</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.isPageAnimate" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">动画类型</div>
          <div class="drawer-setting-item-select">
            <n-select v-model:value="settingStore.pageAnimateType" :options="animateOptions" />
          </div>
        </div>

        <div class="drawer-setting-item">
          <n-alert type="warning" :show-icon="false">
            该功能主要用于实时预览各种布局效果，更多完整配置在 projectSetting.ts 中设置
          </n-alert>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
  import { watch } from 'vue';
  import { useProjectSettingStore } from '@/store/modules/projectSetting';
  import { useDesignSettingStore } from '@/store/modules/designSetting';
  import { animates as animateOptions } from '@/settings/animateSetting';
  import { CheckOutlined } from '@vicons/antd';
  import { Moon, SunnySharp } from '@vicons/ionicons5';

  const settingStore = useProjectSettingStore();
  const designStore = useDesignSettingStore();

  const isDrawer = defineModel<boolean>('show', { default: false });

  watch(
    () => designStore.darkTheme,
    (val) => {
      settingStore.navTheme = val ? 'dark' : 'light';
    },
  );

  type NavTheme = 'dark' | 'light' | 'header-dark';
  function togNavTheme(theme: NavTheme) {
    settingStore.navTheme = theme;
  }

  type NavMode = 'vertical' | 'horizontal' | 'horizontal-mix';
  function togNavMode(mode: NavMode) {
    settingStore.navMode = mode;
    settingStore.menuSetting.mixMenu = false;
  }
</script>

<style lang="scss" scoped>
  .drawer {
    .n-divider:not(.n-divider--vertical) {
      margin: 10px 0;
    }

    &-setting-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      flex-wrap: wrap;

      &-style {
        display: inline-block;
        position: relative;
        margin-right: 16px;
        cursor: pointer;
        text-align: center;

        img {
          width: 56px;
          height: 48px;
          border-radius: 4px;
          border: 2px solid transparent;

          &:hover {
            border-color: #2d8cf0;
          }
        }

        .n-badge {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
        }
      }

      &-title {
        flex: 1;
        font-size: 14px;
      }

      &-action {
        flex: 0 0 auto;
      }

      &-select {
        flex: 1;
      }

      .theme-item {
        width: 20px;
        min-width: 20px;
        height: 20px;
        cursor: pointer;
        border: 1px solid #eee;
        border-radius: 2px;
        margin: 0 5px 5px 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        .n-icon { color: #fff; }
      }
    }

    .align-items-top {
      align-items: flex-start;
      padding: 2px 0;
    }

    .justify-center {
      justify-content: center;
    }

    .dark-switch .n-switch {
      :deep(.n-switch__rail) {
        background-color: #000e1c;
      }
    }
  }
</style>
