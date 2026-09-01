<template>
  <n-drawer v-model:show="isDrawer" :width="340" placement="right">
    <n-drawer-content :title="t('layout.projectConfig', '项目配置')" :native-scrollbar="false">
      <div class="drawer">
        <n-divider title-placement="center">{{ t('layout.presetTitle', '快速预设') }}</n-divider>
        <div class="preset-row">
          <n-button size="small" secondary @click="applyPreset('classic')">
            {{ t('layout.presetClassic', '经典后台') }}
          </n-button>
          <n-button size="small" secondary @click="applyPreset('topNav')">
            {{ t('layout.presetTopNav', '顶部导航') }}
          </n-button>
          <n-button size="small" secondary @click="applyPreset('minimal')">
            {{ t('layout.presetMinimal', '极简') }}
          </n-button>
        </div>

        <n-tabs v-model:value="activeTab" type="segment" size="small" class="drawer-tabs">
          <!-- 主题 -->
          <n-tab-pane name="theme" :tab="t('layout.tabTheme', '主题')">
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
                <span>
                  {{
                    designStore.darkTheme
                      ? t('layout.darkThemeOn', '深色主题')
                      : t('layout.darkThemeOff', '浅色主题')
                  }}
                </span>
              </n-tooltip>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.followSystem', '跟随系统') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch :value="designStore.followSystem" @update:value="designStore.setFollowSystem" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.grayMode', '灰色模式') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch :value="designStore.grayMode" @update:value="designStore.setGrayMode" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.colorWeak', '色弱模式') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch :value="designStore.colorWeak" @update:value="designStore.setColorWeak" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.compact', '紧凑密度') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch :value="designStore.compact" @update:value="designStore.setCompact" />
              </div>
            </div>
            <div class="drawer-setting-item drawer-setting-item-column">
              <div class="drawer-setting-item-title">
                {{ t('layout.borderRadius', '圆角') }}
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

            <n-divider title-placement="center">{{ t('layout.systemTheme', '系统主题色') }}</n-divider>
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
              <div class="drawer-setting-item-title">{{ t('layout.customThemeColor', '自定义主题色') }}</div>
              <div class="drawer-setting-item-action">
                <n-color-picker
                  :value="appThemeColor"
                  :show-alpha="false"
                  :modes="['hex']"
                  @update:value="togTheme"
                >
                  <template #trigger="{ value, onClick, ref: triggerRef }">
                    <n-text
                      :ref="triggerRef"
                      class="color-field__value"
                      :style="{ color: value || undefined }"
                      @click="onClick"
                    >
                      {{ value }}
                    </n-text>
                  </template>
                </n-color-picker>
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.themeEditor', '主题编辑器') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch :value="designStore.showThemeEditor" @update:value="designStore.setShowThemeEditor" />
              </div>
            </div>
            <n-text depth="3" class="drawer-setting-tip">
              {{ t('layout.themeEditorTip', '开启后右下角可编辑主题变量；关闭入口后已保存的覆盖配置仍会继续生效。') }}
            </n-text>
          </n-tab-pane>

          <!-- 布局 -->
          <n-tab-pane name="layout" :tab="t('layout.tabLayout', '布局')">
            <n-divider title-placement="center">{{ t('layout.navMode', '导航栏模式') }}</n-divider>
            <div class="drawer-setting-item align-items-top">
              <div
                class="drawer-setting-item-style"
                :class="{ 'is-active': settingStore.navMode === 'vertical' }"
              >
                <n-tooltip placement="top">
                  <template #trigger>
                    <img src="@/assets/images/nav-theme-dark.svg" alt="" @click="settingStore.setNavMode('vertical')" />
                  </template>
                  <span>{{ t('layout.navModeVertical', '左侧菜单模式') }}</span>
                </n-tooltip>
                <n-badge v-show="settingStore.navMode === 'vertical'" dot color="#19be6b" />
              </div>
              <div
                class="drawer-setting-item-style"
                :class="{ 'is-active': settingStore.navMode === 'horizontal' }"
              >
                <n-tooltip placement="top">
                  <template #trigger>
                    <img src="@/assets/images/nav-horizontal.svg" alt="" @click="settingStore.setNavMode('horizontal')" />
                  </template>
                  <span>{{ t('layout.navModeHorizontal', '顶部菜单模式') }}</span>
                </n-tooltip>
                <n-badge v-show="settingStore.navMode === 'horizontal'" dot color="#19be6b" />
              </div>
              <div
                class="drawer-setting-item-style"
                :class="{ 'is-active': settingStore.navMode === 'horizontal-mix' }"
              >
                <n-tooltip placement="top">
                  <template #trigger>
                    <img src="@/assets/images/nav-horizontal-mix.svg" alt="" @click="settingStore.setNavMode('horizontal-mix')" />
                  </template>
                  <span>{{ t('layout.navModeMix', '混合模式') }}</span>
                </n-tooltip>
                <n-badge v-show="settingStore.navMode === 'horizontal-mix'" dot color="#19be6b" />
              </div>
            </div>

            <n-divider title-placement="center">{{ t('layout.navTheme', '导航栏风格') }}</n-divider>
            <div class="drawer-setting-item align-items-top" :class="{ 'is-disabled': designStore.darkTheme }">
              <div
                class="drawer-setting-item-style"
                :class="{ 'is-active': settingStore.navTheme === 'dark' }"
              >
                <n-tooltip placement="top">
                  <template #trigger>
                    <img src="@/assets/images/nav-theme-dark.svg" alt="" @click="togNavTheme('dark')" />
                  </template>
                  <span>{{ t('layout.navThemeDark', '暗色侧边栏') }}</span>
                </n-tooltip>
                <n-badge v-if="settingStore.navTheme === 'dark'" dot color="#19be6b" />
              </div>
              <div
                class="drawer-setting-item-style"
                :class="{ 'is-active': settingStore.navTheme === 'light' }"
              >
                <n-tooltip placement="top">
                  <template #trigger>
                    <img src="@/assets/images/nav-theme-light.svg" alt="" @click="togNavTheme('light')" />
                  </template>
                  <span>{{ t('layout.navThemeLight', '白色侧边栏') }}</span>
                </n-tooltip>
                <n-badge v-if="settingStore.navTheme === 'light'" dot color="#19be6b" />
              </div>
              <div
                class="drawer-setting-item-style"
                :class="{ 'is-active': settingStore.navTheme === 'header-dark' }"
              >
                <n-tooltip placement="top">
                  <template #trigger>
                    <img src="@/assets/images/header-theme-dark.svg" alt="" @click="togNavTheme('header-dark')" />
                  </template>
                  <span>{{ t('layout.navThemeHeaderDark', '暗色顶栏') }}</span>
                </n-tooltip>
                <n-badge v-if="settingStore.navTheme === 'header-dark'" dot color="#19be6b" />
              </div>
            </div>

            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.fixedHeader', '固定顶栏') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.headerSetting.fixed" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.fixedSider', '固定侧边栏') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.menuSetting.fixed"
                  :disabled="settingStore.navMode === 'horizontal'"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.fixedTabs', '固定多页签') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.multiTabsSetting.fixed"
                  :disabled="!settingStore.multiTabsSetting.show"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.defaultCollapsed', '默认折叠菜单') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.menuSetting.collapsed"
                  :disabled="settingStore.navMode === 'horizontal'"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.mixMenu', '分割菜单（混合模式）') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.menuSetting.mixMenu"
                  :disabled="settingStore.navMode !== 'horizontal-mix'"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.accordion', '菜单手风琴') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.menuSetting.accordion"
                  :disabled="settingStore.navMode === 'horizontal'"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.siderTrigger', '侧边栏触发方式') }}</div>
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
                {{ t('layout.menuWidth', '菜单宽度') }}
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
                {{ t('layout.minMenuWidth', '折叠菜单宽度') }}
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
                {{ t('layout.mobileBreakpoint', '移动端断点') }}
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
              <div class="drawer-setting-item-title">{{ t('layout.headerBg', '顶栏背景色') }}</div>
              <div class="drawer-setting-item-action color-mode-action">
                <n-switch
                  :value="settingStore.headerSetting.bgFollowTheme"
                  :disabled="designStore.darkTheme"
                  size="small"
                  @update:value="settingStore.setHeaderBgFollowTheme"
                />
                <n-text depth="3" style="font-size: 12px">
                  {{
                    settingStore.headerSetting.bgFollowTheme
                      ? t('layout.bgFollowTheme', '跟随主题')
                      : t('layout.bgCustom', '自定义')
                  }}
                </n-text>
                <n-color-picker
                  v-if="!settingStore.headerSetting.bgFollowTheme"
                  :value="headerBgColor"
                  :show-alpha="false"
                  :modes="['hex']"
                  :disabled="designStore.darkTheme"
                  @update:value="settingStore.setHeaderBgColor"
                >
                  <template #trigger="{ value, onClick, ref: triggerRef }">
                    <n-text
                      :ref="triggerRef"
                      class="color-field__value"
                      :style="{ color: value || undefined }"
                      @click="onClick"
                    >
                      {{ value }}
                    </n-text>
                  </template>
                </n-color-picker>
              </div>
            </div>
            <div class="drawer-setting-item" :class="{ 'is-disabled': designStore.darkTheme }">
              <div class="drawer-setting-item-title">{{ t('layout.tabsBg', '页签背景色') }}</div>
              <div class="drawer-setting-item-action color-mode-action">
                <n-switch
                  :value="settingStore.multiTabsSetting.bgFollowTheme"
                  :disabled="designStore.darkTheme || !settingStore.multiTabsSetting.show"
                  size="small"
                  @update:value="settingStore.setTabsBgFollowTheme"
                />
                <n-text depth="3" style="font-size: 12px">
                  {{
                    settingStore.multiTabsSetting.bgFollowTheme
                      ? t('layout.bgFollowTheme', '跟随主题')
                      : t('layout.bgCustom', '自定义')
                  }}
                </n-text>
                <n-color-picker
                  v-if="!settingStore.multiTabsSetting.bgFollowTheme"
                  :value="tabsBgColor"
                  :show-alpha="false"
                  :modes="['hex']"
                  :disabled="designStore.darkTheme || !settingStore.multiTabsSetting.show"
                  @update:value="settingStore.setTabsBgColor"
                >
                  <template #trigger="{ value, onClick, ref: triggerRef }">
                    <n-text
                      :ref="triggerRef"
                      class="color-field__value"
                      :style="{ color: value || undefined }"
                      @click="onClick"
                    >
                      {{ value }}
                    </n-text>
                  </template>
                </n-color-picker>
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.modalHeaderBg', '弹窗顶部背景色') }}</div>
              <div class="drawer-setting-item-action color-mode-action">
                <n-switch
                  :value="settingStore.modalSetting.bgFollowTheme"
                  size="small"
                  @update:value="settingStore.setModalHeaderBgFollowTheme"
                />
                <n-text depth="3" style="font-size: 12px">
                  {{
                    settingStore.modalSetting.bgFollowTheme
                      ? t('layout.bgFollowTheme', '跟随主题')
                      : t('layout.bgCustom', '自定义')
                  }}
                </n-text>
                <n-color-picker
                  v-if="!settingStore.modalSetting.bgFollowTheme"
                  :value="modalHeaderBgColor"
                  :show-alpha="false"
                  :modes="['hex']"
                  @update:value="settingStore.setModalHeaderBgColor"
                >
                  <template #trigger="{ value, onClick, ref: triggerRef }">
                    <n-text
                      :ref="triggerRef"
                      class="color-field__value"
                      :style="{ color: value || undefined }"
                      @click="onClick"
                    >
                      {{ value }}
                    </n-text>
                  </template>
                </n-color-picker>
              </div>
            </div>

            <div class="drawer-setting-item drawer-setting-item-column">
              <div class="drawer-setting-item-title">
                {{ t('layout.contentPadding', '内容区内边距') }}
                <n-text depth="3" style="margin-left: 8px">{{ settingStore.contentSetting.padding }}px</n-text>
              </div>
              <n-slider
                v-model:value="settingStore.contentSetting.padding"
                :min="0"
                :max="32"
                :step="2"
              />
            </div>
            <div class="drawer-setting-item drawer-setting-item-column">
              <div class="drawer-setting-item-title">
                {{ t('layout.contentMaxWidth', '内容区最大宽度') }}
                <n-text depth="3" style="margin-left: 8px">
                  {{
                    settingStore.contentSetting.maxWidth
                      ? `${settingStore.contentSetting.maxWidth}px`
                      : t('layout.contentMaxWidthTip', '0 表示不限制')
                  }}
                </n-text>
              </div>
              <n-slider
                v-model:value="settingStore.contentSetting.maxWidth"
                :min="0"
                :max="CONTENT_MAX_WIDTH"
                :step="40"
              />
            </div>
            <div class="drawer-setting-item drawer-setting-item-column">
              <div class="drawer-setting-item-title">{{ t('layout.footerText', '页脚文案') }}</div>
              <n-input
                v-model:value="settingStore.footerText"
                :placeholder="t('layout.footerTextPlaceholder', '留空则使用默认版权信息')"
                size="small"
                :disabled="!settingStore.showFooter"
                clearable
              />
            </div>
          </n-tab-pane>

          <!-- 显示 -->
          <n-tab-pane name="display" :tab="t('layout.tabDisplay', '显示')">
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showLogo', '显示 Logo') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.showLogo" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showFooter', '显示页脚') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.showFooter" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showReload', '显示重载按钮') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.headerSetting.isReload" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showFullscreen', '显示全屏按钮') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.headerSetting.showFullscreen" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showSearch', '显示菜单搜索') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.headerSetting.showSearch" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showNotice', '显示通知公告') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.headerSetting.showNotice" />
              </div>
            </div>
            <div v-if="I18N_ENABLED" class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showLocale', '显示语言切换') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.headerSetting.showLocale" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showUserInfo', '显示用户信息') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.headerSetting.showUserInfo" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showCrumbs', '显示面包屑导航') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.crumbsSetting.show"
                  :disabled="isHorizontalHeader"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showCrumbsIcon', '面包屑显示图标') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.crumbsSetting.showIcon"
                  :disabled="isHorizontalHeader || !settingStore.crumbsSetting.show"
                />
              </div>
            </div>
            <div v-if="isHorizontalHeader" class="drawer-setting-item" style="padding-top: 0">
              <n-text depth="3" style="font-size: 12px">
                {{ t('layout.crumbsDisabledTip', '当前为顶部菜单布局，面包屑不展示') }}
              </n-text>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.showTabs', '显示多页签') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.multiTabsSetting.show" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.tabsStyle', '页签风格') }}</div>
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
              <div class="drawer-setting-item-title">{{ t('layout.tabsContextMenu', '页签右键菜单') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.multiTabsSetting.showContextMenu"
                  :disabled="!settingStore.multiTabsSetting.show"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.tabsPersist', '页签持久化') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch
                  v-model:value="settingStore.multiTabsSetting.persist"
                  :disabled="!settingStore.multiTabsSetting.show"
                />
              </div>
            </div>
          </n-tab-pane>

          <!-- 体验 -->
          <n-tab-pane name="experience" :tab="t('layout.tabExperience', '体验')">
            <div v-if="I18N_ENABLED" class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.uiLanguage', '界面语言') }}</div>
              <div class="drawer-setting-item-select">
                <n-select
                  :value="settingStore.locale"
                  :options="localeOptions"
                  size="small"
                  @update:value="(v: 'zh-CN' | 'en-US') => settingStore.setLocale(v)"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.enableAnimate', '启用动画') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.isPageAnimate" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.animateType', '动画类型') }}</div>
              <div class="drawer-setting-item-select">
                <n-select
                  v-model:value="settingStore.pageAnimateType"
                  :options="animateOptions"
                  :disabled="!settingStore.isPageAnimate"
                  size="small"
                />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">
                {{ t('layout.respectReducedMotion', '遵循系统减少动效') }}
              </div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.respectReducedMotion" />
              </div>
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.watermark', '开启水印') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.watermark.show" />
              </div>
            </div>
            <div class="drawer-setting-item drawer-setting-item-column">
              <div class="drawer-setting-item-title">{{ t('layout.watermarkText', '水印文案') }}</div>
              <n-input
                v-model:value="settingStore.watermark.text"
                :placeholder="t('layout.watermarkPlaceholder', '留空则使用用户名')"
                size="small"
                :disabled="!settingStore.watermark.show"
                clearable
              />
            </div>
            <div class="drawer-setting-item">
              <div class="drawer-setting-item-title">{{ t('layout.lockScreen', '开启锁屏') }}</div>
              <div class="drawer-setting-item-action">
                <n-switch v-model:value="settingStore.lockScreen.enabled" />
              </div>
            </div>
            <div class="drawer-setting-item drawer-setting-item-column">
              <div class="drawer-setting-item-title">
                {{ t('layout.lockTimeout', '锁屏超时') }}
                <n-text depth="3" style="margin-left: 8px">
                  {{ t('layout.minutes', '{n} 分钟', { n: settingStore.lockScreen.timeout }) }}
                </n-text>
              </div>
              <n-slider
                v-model:value="settingStore.lockScreen.timeout"
                :min="1"
                :max="120"
                :step="1"
                :disabled="!settingStore.lockScreen.enabled"
              />
            </div>
          </n-tab-pane>
        </n-tabs>

        <div class="drawer-setting-item">
          <n-alert type="warning" :show-icon="false">
            {{ t('layout.previewTip', '该面板用于实时预览布局与主题；完整默认值见 projectSetting.ts') }}
          </n-alert>
        </div>

        <div class="drawer-setting-item drawer-setting-actions">
          <n-button block secondary type="info" @click="handleExport">
            {{ t('layout.exportConfig', '导出配置') }}
          </n-button>
          <n-button block secondary type="info" @click="importInputRef?.click()">
            {{ t('layout.importConfig', '导入配置') }}
          </n-button>
          <input
            ref="importInputRef"
            type="file"
            accept="application/json,.json"
            class="import-input"
            @change="handleImportFile"
          />
          <n-button block secondary type="warning" @click="handleReset">
            {{ t('layout.resetConfig', '恢复默认配置') }}
          </n-button>
          <n-button block secondary type="error" @click="handleClearCache">
            {{ t('layout.clearCache', '清除缓存并刷新') }}
          </n-button>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { local } from 'ux-web-storage';
  import { useDialog, useMessage } from 'naive-ui';
  import { useLocaleOptions, useT } from '@/hooks/useT';
  import { I18N_ENABLED } from '@/i18n/config';
  import { animates as animateSettingList } from '@/settings/animateSetting';
  import designSetting from '@/settings/designSetting';
  import type { LayoutPreset, NavTheme } from '@/settings/projectSetting';
  import { CONTENT_MAX_WIDTH } from '@/settings/projectSetting';
  import { normalizeHexColor } from '@/utils/layout';
  import { NAIVE_THEME_EDITOR_KEY } from '@/utils/theme';
  import { clearProjectSettingPersistCache } from '@/store/projectSetting';
  import { clearDesignSettingPersistCache } from '@/store/designSetting';
  import { CheckOutlined } from '@vicons/antd';
  import { Moon, SunnySharp } from '@vicons/ionicons5';

  const settingStore = useProjectSettingStore();
  const designStore = useDesignSettingStore();
  const dialog = useDialog();
  const message = useMessage();
  const importInputRef = ref<HTMLInputElement | null>(null);
  const { t } = useT();
  const localeOptions = useLocaleOptions();
  const activeTab = ref('theme');
  const isDrawer = defineModel<boolean>('show', { default: false });

  const headerBgColor = computed(() => normalizeHexColor(settingStore.headerSetting.bgColor));
  const tabsBgColor = computed(() => normalizeHexColor(settingStore.multiTabsSetting.bgColor));
  const modalHeaderBgColor = computed(() =>
    normalizeHexColor(settingStore.modalSetting.headerBgColor),
  );
  const appThemeColor = computed(() =>
    normalizeHexColor(designStore.appTheme, designSetting.appTheme),
  );

  const isHorizontalHeader = computed(
    () =>
      settingStore.navMode === 'horizontal' ||
      (settingStore.navMode === 'horizontal-mix' && settingStore.menuSetting.mixMenu),
  );

  const triggerOptions = computed(() => [
    { label: t('layout.triggerClick', '点击折叠'), value: 'click' },
    { label: t('layout.triggerHover', '悬停展开'), value: 'hover' },
  ]);

  const tabsStyleOptions = computed(() => [
    { label: t('layout.tabsStyleCard', '卡片'), value: 'card' },
    { label: t('layout.tabsStyleSimple', '极简'), value: 'simple' },
    { label: t('layout.tabsStyleDot', '圆点'), value: 'dot' },
  ]);

  const animateOptions = computed(() =>
    animateSettingList.map(item => ({
      value: item.value,
      label: t(item.i18nKey, item.label),
    })),
  );

  function applyPreset(preset: LayoutPreset) {
    settingStore.applyPreset(preset);
    if (preset === 'minimal') {
      if (designStore.darkTheme)
        designStore.setDarkTheme(false);
    } else {
      settingStore.syncNavThemeForDark(designStore.darkTheme);
    }
  }

  function togDarkTheme(val: boolean) {
    if (!designStore.followSystem)
      designStore.setDarkTheme(val);
  }

  function togTheme(color: string | null) {
    designStore.setAppTheme(normalizeHexColor(color, designSetting.appTheme));
  }

  function togNavTheme(theme: NavTheme) {
    if (!designStore.darkTheme)
      settingStore.setNavTheme(theme);
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
    message.success(t('layout.exportSuccess', '配置已导出'));
  }

  function handleImportFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file)
      return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        const project = data.project;
        const design = data.design;
        if (project && typeof project === 'object') {
          settingStore.importSetting(project);
        } else if (!design && data && typeof data === 'object') {
          // 兼容仅导出 project 字段的旧文件
          settingStore.importSetting(data);
        }
        if (design && typeof design === 'object')
          designStore.importSetting(design);
        settingStore.syncNavThemeForDark(designStore.darkTheme);
        message.success(t('layout.importSuccess', '配置已导入'));
      } catch {
        message.error(t('layout.importFailed', '配置文件解析失败'));
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
  }

  function handleReset() {
    dialog.warning({
      title: t('layout.resetTitle', '恢复默认配置'),
      content: t('layout.resetContent', '将重置布局、主题等项目配置为默认值，是否继续？'),
      positiveText: t('common.confirm', '确定'),
      negativeText: t('common.cancel', '取消'),
      onPositiveClick: () => {
        settingStore.resetSetting();
        designStore.resetSetting();
        settingStore.syncNavThemeForDark(designStore.darkTheme);
        message.success(t('layout.resetSuccess', '已恢复默认配置'));
      },
    });
  }

  function handleClearCache() {
    dialog.error({
      title: t('layout.clearCacheTitle', '清除缓存'),
      content: t('layout.clearCacheContent', '将清除本地配置缓存并刷新页面，是否继续？'),
      positiveText: t('common.confirm', '确定'),
      negativeText: t('common.cancel', '取消'),
      onPositiveClick: () => {
        try {
          clearProjectSettingPersistCache();
          clearDesignSettingPersistCache();
          delete local.__project_setting__;
          delete local.__design_setting__;
          delete local[NAIVE_THEME_EDITOR_KEY];
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

    .drawer-tabs {
      margin-top: 4px;
    }

    .preset-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
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

      .color-mode-action {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }

      .color-field__value {
        cursor: pointer;
        font-size: 13px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        white-space: nowrap;
        user-select: none;
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
