<template>
  <n-drawer v-model:show="isDrawer" :width="320" placement="right">
    <n-drawer-content title="项目配置" :native-scrollbar="false">
      <div class="drawer">
        <!-- 主题 -->
        <n-divider title-placement="center">主题</n-divider>
        <div class="drawer-setting-item justify-center dark-switch">
          <n-tooltip placement="bottom">
            <template #trigger>
              <n-switch
                :value="designStore.darkTheme"
                :disabled="designStore.followSystem"
                class="dark-theme-switch"
                @update:value="togDarkTheme"
              >
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
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">跟随系统</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :value="designStore.followSystem"
              @update:value="togFollowSystem"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">灰色模式</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :value="designStore.grayMode"
              @update:value="designStore.setGrayMode"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">色弱模式</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :value="designStore.colorWeak"
              @update:value="designStore.setColorWeak"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">紧凑密度</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :value="designStore.compact"
              @update:value="designStore.setCompact"
            />
          </div>
        </div>
        <div class="drawer-setting-item drawer-setting-item-column">
          <div class="drawer-setting-item-title">
            圆角
            <n-text depth="3" style="margin-left: 8px">{{ designStore.borderRadius }}px</n-text>
          </div>
          <n-slider
            :value="designStore.borderRadius"
            :min="0"
            :max="16"
            :step="1"
            @update:value="designStore.setBorderRadius"
          />
        </div>

        <!-- 系统主题色 -->
        <n-divider title-placement="center">系统主题</n-divider>
        <div class="drawer-setting-item align-items-top">
          <span
            v-for="(item, index) in designStore.appThemeList"
            :key="index"
            class="theme-item"
            :class="{ 'theme-item-active': item === designStore.appTheme }"
            :style="{ backgroundColor: item }"
            @click="togTheme(item)"
          >
            <n-icon v-if="item === designStore.appTheme" size="12">
              <CheckOutlined />
            </n-icon>
          </span>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">自定义主题色</div>
          <div class="drawer-setting-item-action color-field">
            <div class="color-field__swatch">
              <n-color-picker
                :value="appThemeColor"
                :show-alpha="false"
                :modes="['hex']"
                size="small"
                :render-label="renderEmptyColorLabel"
                @update:value="togTheme"
              />
            </div>
            <span class="color-field__value">{{ appThemeColor }}</span>
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">主题编辑器</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :value="designStore.showThemeEditor"
              @update:value="togThemeEditor"
            />
          </div>
        </div>
        <n-text depth="3" class="drawer-setting-tip">
          开启后右下角可编辑主题变量；关闭入口后已保存的覆盖配置仍会继续生效。
        </n-text>

        <!-- 导航栏模式 -->
        <n-divider title-placement="center">导航栏模式</n-divider>
        <div class="drawer-setting-item align-items-top">
          <div
            class="drawer-setting-item-style"
            :class="{ 'is-active': settingStore.navMode === 'vertical' }"
          >
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-theme-dark.svg" alt="左侧菜单" @click="togNavMode('vertical')" />
              </template>
              <span>左侧菜单模式</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-show="settingStore.navMode === 'vertical'" />
          </div>
          <div
            class="drawer-setting-item-style"
            :class="{ 'is-active': settingStore.navMode === 'horizontal' }"
          >
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-horizontal.svg" alt="顶部菜单" @click="togNavMode('horizontal')" />
              </template>
              <span>顶部菜单模式</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-show="settingStore.navMode === 'horizontal'" />
          </div>
          <div
            class="drawer-setting-item-style"
            :class="{ 'is-active': settingStore.navMode === 'horizontal-mix' }"
          >
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
        <div class="drawer-setting-item align-items-top" :class="{ 'is-disabled': designStore.darkTheme }">
          <div
            class="drawer-setting-item-style"
            :class="{ 'is-active': settingStore.navTheme === 'dark' }"
          >
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-theme-dark.svg" alt="暗色侧边栏" @click="togNavTheme('dark')" />
              </template>
              <span>暗色侧边栏</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-if="settingStore.navTheme === 'dark'" />
          </div>
          <div
            class="drawer-setting-item-style"
            :class="{ 'is-active': settingStore.navTheme === 'light' }"
          >
            <n-tooltip placement="top">
              <template #trigger>
                <img src="@/assets/images/nav-theme-light.svg" alt="白色侧边栏" @click="togNavTheme('light')" />
              </template>
              <span>白色侧边栏</span>
            </n-tooltip>
            <n-badge dot color="#19be6b" v-if="settingStore.navTheme === 'light'" />
          </div>
          <div
            class="drawer-setting-item-style"
            :class="{ 'is-active': settingStore.navTheme === 'header-dark' }"
          >
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
          <div class="drawer-setting-item-title">固定侧边栏</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="settingStore.navMode === 'horizontal'"
              v-model:value="settingStore.menuSetting.fixed"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">固定多页签</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="!settingStore.multiTabsSetting.show"
              v-model:value="settingStore.multiTabsSetting.fixed"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">默认折叠菜单</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="settingStore.navMode === 'horizontal'"
              v-model:value="settingStore.menuSetting.collapsed"
            />
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
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">菜单手风琴</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="settingStore.navMode === 'horizontal'"
              v-model:value="settingStore.menuSetting.accordion"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">侧边栏触发方式</div>
          <div class="drawer-setting-item-select">
            <n-select
              v-model:value="settingStore.menuSetting.trigger"
              :options="triggerOptions"
              :disabled="settingStore.navMode === 'horizontal'"
              size="small"
            />
          </div>
        </div>
        <div class="drawer-setting-item drawer-setting-item-column">
          <div class="drawer-setting-item-title">
            菜单宽度
            <n-text depth="3" style="margin-left: 8px">{{ settingStore.menuSetting.menuWidth }}px</n-text>
          </div>
          <n-slider
            v-model:value="settingStore.menuSetting.menuWidth"
            :min="160"
            :max="320"
            :step="8"
            :disabled="settingStore.navMode === 'horizontal'"
          />
        </div>
        <div class="drawer-setting-item drawer-setting-item-column">
          <div class="drawer-setting-item-title">
            折叠菜单宽度
            <n-text depth="3" style="margin-left: 8px">{{ settingStore.menuSetting.minMenuWidth }}px</n-text>
          </div>
          <n-slider
            v-model:value="settingStore.menuSetting.minMenuWidth"
            :min="48"
            :max="96"
            :step="4"
            :disabled="settingStore.navMode === 'horizontal'"
          />
        </div>
        <div class="drawer-setting-item drawer-setting-item-column">
          <div class="drawer-setting-item-title">
            移动端断点
            <n-text depth="3" style="margin-left: 8px">{{ settingStore.menuSetting.mobileWidth }}px</n-text>
          </div>
          <n-slider
            v-model:value="settingStore.menuSetting.mobileWidth"
            :min="640"
            :max="1200"
            :step="20"
          />
        </div>
        <div class="drawer-setting-item" :class="{ 'is-disabled': designStore.darkTheme }">
          <div class="drawer-setting-item-title">顶栏背景色</div>
          <div class="drawer-setting-item-action color-field">
            <div class="color-field__swatch">
              <n-color-picker
                :value="headerBgColor"
                :show-alpha="false"
                :modes="['hex']"
                size="small"
                :render-label="renderEmptyColorLabel"
                :disabled="designStore.darkTheme"
                @update:value="onHeaderBgColorChange"
              />
            </div>
            <span class="color-field__value">{{ headerBgColor }}</span>
          </div>
        </div>
        <div class="drawer-setting-item" :class="{ 'is-disabled': designStore.darkTheme }">
          <div class="drawer-setting-item-title">页签背景色</div>
          <div class="drawer-setting-item-action color-field">
            <div class="color-field__swatch">
              <n-color-picker
                :value="tabsBgColor"
                :show-alpha="false"
                :modes="['hex']"
                size="small"
                :render-label="renderEmptyColorLabel"
                :disabled="designStore.darkTheme || !settingStore.multiTabsSetting.show"
                @update:value="onTabsBgColorChange"
              />
            </div>
            <span class="color-field__value">{{ tabsBgColor }}</span>
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">弹窗顶部背景色</div>
          <div class="drawer-setting-item-action color-field">
            <div class="color-field__swatch">
              <n-color-picker
                :value="modalHeaderBgColor"
                :show-alpha="false"
                :modes="['hex']"
                size="small"
                :render-label="renderEmptyColorLabel"
                @update:value="onModalHeaderBgColorChange"
              />
            </div>
            <span class="color-field__value">{{ modalHeaderBgColor }}</span>
          </div>
        </div>

        <!-- 界面显示 -->
        <n-divider title-placement="center">界面显示</n-divider>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示 Logo</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.showLogo" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示页脚</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.showFooter" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示重载按钮</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.headerSetting.isReload" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示全屏按钮</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.headerSetting.showFullscreen" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示菜单搜索</div>
          <div class="drawer-setting-item-action">
            <n-switch :value="settingStore.headerSetting.showSearch !== false" @update:value="(v: boolean) => settingStore.headerSetting.showSearch = v" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示通知公告</div>
          <div class="drawer-setting-item-action">
            <n-switch :value="settingStore.headerSetting.showNotice !== false" @update:value="(v: boolean) => settingStore.headerSetting.showNotice = v" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示用户信息</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.headerSetting.showUserInfo" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示面包屑导航</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="isHorizontalHeader"
              v-model:value="settingStore.crumbsSetting.show"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">面包屑显示图标</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="isHorizontalHeader || !settingStore.crumbsSetting.show"
              v-model:value="settingStore.crumbsSetting.showIcon"
            />
          </div>
        </div>
        <div v-if="isHorizontalHeader" class="drawer-setting-item" style="padding-top: 0">
          <n-text depth="3" style="font-size: 12px">
            当前为顶部菜单布局，面包屑不展示
          </n-text>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">显示多页签</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.multiTabsSetting.show" />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">页签风格</div>
          <div class="drawer-setting-item-select">
            <n-select
              v-model:value="settingStore.multiTabsSetting.style"
              :options="tabsStyleOptions"
              :disabled="!settingStore.multiTabsSetting.show"
              size="small"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">页签右键菜单</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="!settingStore.multiTabsSetting.show"
              v-model:value="settingStore.multiTabsSetting.showContextMenu"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">页签持久化</div>
          <div class="drawer-setting-item-action">
            <n-switch
              :disabled="!settingStore.multiTabsSetting.show"
              v-model:value="settingStore.multiTabsSetting.persist"
            />
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
            <n-select
              v-model:value="settingStore.pageAnimateType"
              :options="animateOptions"
              :disabled="!settingStore.isPageAnimate"
              size="small"
            />
          </div>
        </div>

        <!-- 体验 -->
        <n-divider title-placement="center">体验</n-divider>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">界面语言</div>
          <div class="drawer-setting-item-select">
            <n-select
              v-model:value="settingStore.locale"
              :options="localeOptions"
              size="small"
            />
          </div>
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">开启水印</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.watermark.show" />
          </div>
        </div>
        <div class="drawer-setting-item drawer-setting-item-column">
          <div class="drawer-setting-item-title">水印文案</div>
          <n-input
            v-model:value="settingStore.watermark.text"
            placeholder="留空则使用用户名"
            size="small"
            :disabled="!settingStore.watermark.show"
            clearable
          />
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">开启锁屏</div>
          <div class="drawer-setting-item-action">
            <n-switch v-model:value="settingStore.lockScreen.enabled" />
          </div>
        </div>
        <div class="drawer-setting-item drawer-setting-item-column">
          <div class="drawer-setting-item-title">
            锁屏超时
            <n-text depth="3" style="margin-left: 8px">{{ settingStore.lockScreen.timeout }} 分钟</n-text>
          </div>
          <n-slider
            v-model:value="settingStore.lockScreen.timeout"
            :min="1"
            :max="120"
            :step="1"
            :disabled="!settingStore.lockScreen.enabled"
          />
        </div>
        <div class="drawer-setting-item">
          <div class="drawer-setting-item-title">权限模式</div>
          <div class="drawer-setting-item-select">
            <n-select
              v-model:value="settingStore.permissionMode"
              :options="permissionOptions"
              size="small"
            />
          </div>
        </div>

        <div class="drawer-setting-item">
          <n-alert type="warning" :show-icon="false">
            该功能主要用于实时预览各种布局效果，更多完整配置在 projectSetting.ts 中设置
          </n-alert>
        </div>

        <div class="drawer-setting-item drawer-setting-actions">
          <n-button block secondary type="info" @click="handleExport">
            导出配置
          </n-button>
          <n-button block secondary type="info" @click="triggerImport">
            导入配置
          </n-button>
          <input
            ref="importInputRef"
            type="file"
            accept="application/json,.json"
            class="import-input"
            @change="handleImportFile"
          />
          <n-button block secondary type="warning" @click="handleReset">
            恢复默认配置
          </n-button>
          <n-button block secondary type="error" @click="handleClearCache">
            清除缓存并刷新
          </n-button>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { useDialog, useMessage } from 'naive-ui';
  import { animates as animateOptions } from '@/settings/animateSetting';
  import { NAIVE_THEME_EDITOR_KEY } from '@/utils/theme';
  import { CheckOutlined } from '@vicons/antd';
  import { Moon, SunnySharp } from '@vicons/ionicons5';

  const settingStore = useProjectSettingStore();
  const designStore = useDesignSettingStore();
  const dialog = useDialog();
  const message = useMessage();
  const importInputRef = ref<HTMLInputElement | null>(null);

  const isDrawer = defineModel<boolean>('show', { default: false });

  /** n-color-picker 仅在 value 能解析为颜色时才渲染色块；统一规范为 6 位 hex */
  function normalizeHexColor(value: unknown, fallback = '#ffffff'): string {
    if (typeof value !== 'string')
      return fallback;
    const v = value.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)) {
      return v.length === 4
        ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
        : v;
    }
    return fallback;
  }

  /** 隐藏选择器内部色值文案，避免与右侧展示重复 */
  function renderEmptyColorLabel() {
    return '';
  }

  // 修复旧缓存里可能被写成 null/空字符串的颜色，避免选择器空白
  settingStore.setHeaderBgColor(settingStore.headerSetting?.bgColor);
  settingStore.setTabsBgColor(settingStore.multiTabsSetting?.bgColor);
  settingStore.setModalHeaderBgColor(settingStore.modalSetting?.headerBgColor);
  if (designStore.appTheme) {
    designStore.setAppTheme(normalizeHexColor(designStore.appTheme, '#2d8cf0'));
  }

  const headerBgColor = computed(() =>
    normalizeHexColor(settingStore.headerSetting?.bgColor),
  );
  const tabsBgColor = computed(() =>
    normalizeHexColor(settingStore.multiTabsSetting?.bgColor),
  );
  const modalHeaderBgColor = computed(() =>
    normalizeHexColor(settingStore.modalSetting?.headerBgColor),
  );
  const appThemeColor = computed(() =>
    normalizeHexColor(designStore.appTheme, '#2d8cf0'),
  );

  function onHeaderBgColorChange(color: string | null) {
    settingStore.setHeaderBgColor(color);
  }
  function onTabsBgColorChange(color: string | null) {
    settingStore.setTabsBgColor(color);
  }
  function onModalHeaderBgColorChange(color: string | null) {
    settingStore.setModalHeaderBgColor(color);
  }

  const isHorizontalHeader = computed(
    () =>
      settingStore.navMode === 'horizontal' ||
      (settingStore.navMode === 'horizontal-mix' && settingStore.menuSetting.mixMenu),
  );

  const triggerOptions = [
    { label: '点击折叠', value: 'click' },
    { label: '悬停展开', value: 'hover' },
  ];

  const tabsStyleOptions = [
    { label: '卡片', value: 'card' },
    { label: '极简', value: 'simple' },
    { label: '圆点', value: 'dot' },
  ];

  const localeOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: 'English', value: 'en-US' },
  ];

  const permissionOptions = [
    { label: '前端固定', value: 'FIXED' },
    { label: '后端动态', value: 'BACKEND' },
  ];

  type NavTheme = 'dark' | 'light' | 'header-dark';
  type NavMode = 'vertical' | 'horizontal' | 'horizontal-mix';

  function togDarkTheme(val: boolean) {
    if (designStore.followSystem) return;
    designStore.setDarkTheme(val);
    settingStore.navTheme = val ? 'header-dark' : 'dark';
  }

  function togFollowSystem(val: boolean) {
    designStore.setFollowSystem(val);
    if (val) {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      designStore.setDarkTheme(dark);
      settingStore.navTheme = dark ? 'header-dark' : 'dark';
    }
  }

  function togTheme(color: string | null) {
    designStore.setAppTheme(normalizeHexColor(color, '#2d8cf0'));
  }

  function togThemeEditor(val: boolean) {
    designStore.setShowThemeEditor(val);
  }

  function togNavTheme(theme: NavTheme) {
    if (designStore.darkTheme) return;
    if (settingStore.navMode === 'horizontal' && theme === 'light') {
      settingStore.navTheme = 'dark';
      return;
    }
    settingStore.navTheme = theme;
  }

  function togNavMode(mode: NavMode) {
    settingStore.navMode = mode;
    settingStore.menuSetting.mixMenu = false;
    if (mode === 'horizontal' && settingStore.navTheme === 'light') {
      settingStore.navTheme = 'dark';
    }
  }

  function handleExport() {
    const payload = {
      project: settingStore.exportSetting(),
      design: designStore.exportSetting(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-setting-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('配置已导出');
  }

  function triggerImport() {
    importInputRef.value?.click();
  }

  function handleImportFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        const project = data.project ?? data;
        const design = data.design;
        if (project && typeof project === 'object') {
          settingStore.importSetting(project);
        }
        if (design && typeof design === 'object') {
          designStore.importSetting(design);
        }
        message.success('配置已导入');
      } catch {
        message.error('配置文件解析失败');
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    dialog.warning({
      title: '恢复默认配置',
      content: '将重置布局、主题等项目配置为默认值，是否继续？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        settingStore.resetSetting();
        designStore.resetSetting();
        message.success('已恢复默认配置');
      },
    });
  }

  function handleClearCache() {
    dialog.error({
      title: '清除缓存',
      content: '将清除本地配置缓存并刷新页面，是否继续？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        try {
          localStorage.removeItem('__project_setting__');
          localStorage.removeItem('__design_setting__');
          localStorage.removeItem(NAIVE_THEME_EDITOR_KEY);
        } catch {}
        location.reload();
      },
    });
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

      &-column {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;

        .drawer-setting-item-title {
          flex: none;
        }
      }

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
          transition: border-color 0.2s;

          &:hover {
            border-color: var(--n-primary-color, #2d8cf0);
          }
        }

        &.is-active img {
          border-color: var(--n-primary-color, #2d8cf0);
        }

        .n-badge {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
        }
      }

      &-title {
        flex: 1 1 auto;
        min-width: 0;
        font-size: 14px;
      }

      &-action {
        flex: 0 0 auto;
      }

      &-select {
        flex: 0 0 120px;
      }

      .color-field {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        max-width: none;
      }

      .color-field__swatch {
        width: 28px;
        height: 28px;
        flex: 0 0 28px;
        position: relative;

        :deep(.n-color-picker) {
          width: 28px !important;
          min-width: 28px !important;
          height: 28px !important;
          border: 1px solid rgba(0, 0, 0, 0.12);
        }

        :deep(.n-color-picker__fill) {
          left: 2px;
          right: 2px;
          top: 2px;
          bottom: 2px;
        }

        :deep(.n-color-picker__value) {
          display: none;
        }
      }

      .color-field__value {
        flex: 0 0 auto;
        font-size: 12px;
        line-height: 28px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        color: var(--n-text-color-2, #666);
        white-space: nowrap;
        user-select: all;
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
        box-sizing: border-box;

        .n-icon {
          color: #fff;
        }

        &-active {
          border-color: var(--n-primary-color, #2d8cf0);
          box-shadow: 0 0 0 1px var(--n-primary-color, #2d8cf0);
        }
      }

      &.is-disabled {
        opacity: 0.45;
        pointer-events: none;
      }
    }

    &-setting-actions {
      flex-direction: column;
      gap: 10px;
      padding-top: 4px;
    }

    .drawer-setting-tip {
      display: block;
      margin: -4px 0 8px;
      font-size: 12px;
      line-height: 1.5;
    }

    .import-input {
      display: none;
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
