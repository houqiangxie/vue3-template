import { defineStore } from 'pinia';
import { local } from 'ux-web-storage';
import projectSetting, { CONTENT_MAX_WIDTH } from '@/settings/projectSetting';
import type {
  LayoutPreset,
  MenuTrigger,
  NavMode,
  NavTheme,
  TabsStyle,
} from '@/settings/projectSetting';
import { animateValues, type PageAnimateType } from '@/settings/animateSetting';
import { isDefaultWhite, normalizeHexColor } from '@/utils/layout';
import { type AppLocale } from '@/i18n/types';
import { resolveAppLocale } from '@/i18n/config';

const PERSIST_KEY = '__project_setting__';

const defaults = projectSetting;

export interface IHeaderSetting {
  bgColor: string;
  bgFollowTheme: boolean;
  fixed: boolean;
  isReload: boolean;
  showFullscreen: boolean;
  showUserInfo: boolean;
  showSearch: boolean;
  showNotice: boolean;
  showLocale: boolean;
}

export interface IModalSetting {
  headerBgColor: string;
  bgFollowTheme: boolean;
}

export interface IMenuSetting {
  minMenuWidth: number;
  menuWidth: number;
  fixed: boolean;
  mixMenu: boolean;
  mobileWidth: number;
  collapsed: boolean;
  accordion: boolean;
  trigger: MenuTrigger;
}

export interface IMultiTabsSetting {
  bgColor: string;
  bgFollowTheme: boolean;
  show: boolean;
  fixed: boolean;
  style: TabsStyle;
  showContextMenu: boolean;
  persist: boolean;
}

export interface ICrumbsSetting {
  show: boolean;
  showIcon: boolean;
}

export interface IWatermarkSetting {
  show: boolean;
  text: string;
}

export interface ILockScreenSetting {
  enabled: boolean;
  timeout: number;
}

export interface IContentSetting {
  padding: number;
  maxWidth: number;
}

interface ProjectSettingState {
  navMode: NavMode;
  navTheme: NavTheme;
  lastLightNavTheme: NavTheme;
  showLogo: boolean;
  locale: AppLocale;
  headerSetting: IHeaderSetting;
  modalSetting: IModalSetting;
  showFooter: boolean;
  footerText: string;
  contentSetting: IContentSetting;
  menuSetting: IMenuSetting;
  multiTabsSetting: IMultiTabsSetting;
  crumbsSetting: ICrumbsSetting;
  watermark: IWatermarkSetting;
  lockScreen: ILockScreenSetting;
  isPageAnimate: boolean;
  respectReducedMotion: boolean;
  pageAnimateType: PageAnimateType;
  isMobile: boolean;
}

type PersistedState = Omit<ProjectSettingState, 'isMobile'>;

const NAV_MODES: NavMode[] = ['vertical', 'horizontal', 'horizontal-mix'];
const NAV_THEMES: NavTheme[] = ['dark', 'light', 'header-dark'];
const LIGHT_NAV_THEMES: NavTheme[] = ['dark', 'light'];
const TABS_STYLES: TabsStyle[] = ['card', 'simple', 'dot'];

function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n))
    return fallback;
  return Math.min(max, Math.max(min, n));
}

function resolveFollowTheme(
  persistedFollow: boolean | undefined,
  hadColor: boolean,
  normalizedColor: string,
  defaultFollow: boolean,
): boolean {
  if (persistedFollow != null)
    return persistedFollow;
  if (hadColor)
    return isDefaultWhite(normalizedColor);
  return defaultFollow;
}

function cloneDefaults(): PersistedState {
  return {
    navMode: defaults.navMode,
    navTheme: defaults.navTheme,
    lastLightNavTheme: defaults.lastLightNavTheme,
    showLogo: defaults.showLogo,
    locale: defaults.locale,
    headerSetting: { ...defaults.headerSetting },
    modalSetting: { ...defaults.modalSetting },
    showFooter: defaults.showFooter,
    footerText: defaults.footerText,
    contentSetting: { ...defaults.contentSetting },
    menuSetting: { ...defaults.menuSetting },
    multiTabsSetting: { ...defaults.multiTabsSetting },
    crumbsSetting: { ...defaults.crumbsSetting },
    watermark: { ...defaults.watermark },
    lockScreen: { ...defaults.lockScreen },
    isPageAnimate: defaults.isPageAnimate,
    respectReducedMotion: defaults.respectReducedMotion,
    pageAnimateType: defaults.pageAnimateType,
  };
}

function loadState(): Partial<PersistedState> {
  try {
    const cached = local[PERSIST_KEY] as Partial<PersistedState> | undefined;
    return cached && typeof cached === 'object' ? cached : {};
  } catch {
    return {};
  }
}

function mergeHeaderSetting(persisted?: Partial<IHeaderSetting> | null): IHeaderSetting {
  const merged = { ...defaults.headerSetting, ...(persisted ?? {}) };
  merged.bgColor = normalizeHexColor(merged.bgColor, defaults.headerSetting.bgColor);
  merged.bgFollowTheme = resolveFollowTheme(
    persisted?.bgFollowTheme,
    persisted?.bgColor != null,
    merged.bgColor,
    defaults.headerSetting.bgFollowTheme,
  );
  merged.showSearch = merged.showSearch !== false;
  merged.showNotice = merged.showNotice !== false;
  merged.showLocale = merged.showLocale !== false;
  return merged;
}

function mergeMultiTabsSetting(persisted?: Partial<IMultiTabsSetting> | null): IMultiTabsSetting {
  const merged = { ...defaults.multiTabsSetting, ...(persisted ?? {}) };
  merged.bgColor = normalizeHexColor(merged.bgColor, defaults.multiTabsSetting.bgColor);
  merged.bgFollowTheme = resolveFollowTheme(
    persisted?.bgFollowTheme,
    persisted?.bgColor != null,
    merged.bgColor,
    defaults.multiTabsSetting.bgFollowTheme,
  );
  merged.style = pick(merged.style, TABS_STYLES, defaults.multiTabsSetting.style);
  return merged;
}

function mergeModalSetting(persisted?: Partial<IModalSetting> | null): IModalSetting {
  const headerBgColor = normalizeHexColor(
    persisted?.headerBgColor,
    defaults.modalSetting.headerBgColor,
  );
  return {
    headerBgColor,
    bgFollowTheme: resolveFollowTheme(
      persisted?.bgFollowTheme,
      persisted?.headerBgColor != null,
      headerBgColor,
      defaults.modalSetting.bgFollowTheme,
    ),
  };
}

function mergeMenuSetting(persisted?: Partial<IMenuSetting>): IMenuSetting {
  const merged = { ...defaults.menuSetting, ...(persisted ?? {}) };
  merged.menuWidth = clampNumber(merged.menuWidth, 160, 320, defaults.menuSetting.menuWidth);
  merged.minMenuWidth = clampNumber(merged.minMenuWidth, 48, 96, defaults.menuSetting.minMenuWidth);
  merged.mobileWidth = clampNumber(merged.mobileWidth, 640, 1200, defaults.menuSetting.mobileWidth);
  merged.trigger = pick(merged.trigger, ['click', 'hover'] as const, defaults.menuSetting.trigger);
  return merged;
}

function mergeContentSetting(persisted?: Partial<IContentSetting>): IContentSetting {
  return {
    padding: clampNumber(persisted?.padding, 0, 32, defaults.contentSetting.padding),
    maxWidth: clampNumber(persisted?.maxWidth, 0, CONTENT_MAX_WIDTH, defaults.contentSetting.maxWidth),
  };
}

function mergeLockScreen(persisted?: Partial<ILockScreenSetting>): ILockScreenSetting {
  return {
    enabled: persisted?.enabled ?? defaults.lockScreen.enabled,
    timeout: clampNumber(persisted?.timeout, 1, 120, defaults.lockScreen.timeout),
  };
}

/** 从 partial（可与当前态合并后）构建合法持久化状态 */
function buildPersisted(partial: Partial<PersistedState>): PersistedState {
  const d = cloneDefaults();
  return {
    navMode: pick(partial.navMode, NAV_MODES, d.navMode),
    navTheme: pick(partial.navTheme, NAV_THEMES, d.navTheme),
    lastLightNavTheme: pick(partial.lastLightNavTheme, LIGHT_NAV_THEMES, d.lastLightNavTheme),
    showLogo: partial.showLogo ?? d.showLogo,
    locale: resolveAppLocale(partial.locale ?? d.locale),
    headerSetting: mergeHeaderSetting(partial.headerSetting),
    modalSetting: mergeModalSetting(partial.modalSetting),
    showFooter: partial.showFooter ?? d.showFooter,
    footerText: partial.footerText ?? d.footerText,
    contentSetting: mergeContentSetting(partial.contentSetting),
    menuSetting: mergeMenuSetting(partial.menuSetting),
    multiTabsSetting: mergeMultiTabsSetting(partial.multiTabsSetting),
    crumbsSetting: { ...d.crumbsSetting, ...(partial.crumbsSetting ?? {}) },
    watermark: { ...d.watermark, ...(partial.watermark ?? {}) },
    lockScreen: mergeLockScreen(partial.lockScreen),
    isPageAnimate: partial.isPageAnimate ?? d.isPageAnimate,
    respectReducedMotion: partial.respectReducedMotion ?? d.respectReducedMotion,
    pageAnimateType: pick(partial.pageAnimateType, animateValues, d.pageAnimateType),
  };
}

function mergeImportSource(
  current: PersistedState,
  data: Partial<PersistedState>,
): Partial<PersistedState> {
  return {
    ...current,
    ...data,
    headerSetting: data.headerSetting
      ? { ...current.headerSetting, ...data.headerSetting }
      : current.headerSetting,
    modalSetting: data.modalSetting
      ? { ...current.modalSetting, ...data.modalSetting }
      : current.modalSetting,
    menuSetting: data.menuSetting
      ? { ...current.menuSetting, ...data.menuSetting }
      : current.menuSetting,
    multiTabsSetting: data.multiTabsSetting
      ? { ...current.multiTabsSetting, ...data.multiTabsSetting }
      : current.multiTabsSetting,
    contentSetting: data.contentSetting
      ? { ...current.contentSetting, ...data.contentSetting }
      : current.contentSetting,
    crumbsSetting: data.crumbsSetting
      ? { ...current.crumbsSetting, ...data.crumbsSetting }
      : current.crumbsSetting,
    watermark: data.watermark
      ? { ...current.watermark, ...data.watermark }
      : current.watermark,
    lockScreen: data.lockScreen
      ? { ...current.lockScreen, ...data.lockScreen }
      : current.lockScreen,
  };
}

let lastPersistedPayload = '';

export function persistProjectSetting(state: ProjectSettingState) {
  try {
    const { isMobile: _isMobile, ...rest } = state;
    const payload = JSON.stringify(rest);
    if (payload === lastPersistedPayload)
      return;
    lastPersistedPayload = payload;
    local[PERSIST_KEY] = rest;
  } catch {
    // ignore
  }
}

export function clearProjectSettingPersistCache() {
  lastPersistedPayload = '';
}

function compatibleNavTheme(mode: NavMode, theme: NavTheme): NavTheme {
  return mode === 'horizontal' && theme === 'light' ? 'dark' : theme;
}

function asLightNavTheme(theme: NavTheme): NavTheme {
  return theme === 'header-dark' ? 'dark' : theme;
}

export const useProjectSettingStore = defineStore('app-project-setting', {
  state: (): ProjectSettingState => ({
    ...buildPersisted(loadState()),
    isMobile: false,
  }),
  actions: {
    setNavMode(value: NavMode): void {
      if (this.navMode !== value) {
        this.navMode = value;
        // 切换模式时关闭分割菜单；同模式重复点击不重置，避免误关 mixMenu
        this.menuSetting.mixMenu = false;
      }
      const theme = compatibleNavTheme(this.navMode, this.navTheme);
      if (theme !== this.navTheme) {
        this.navTheme = theme;
        this.lastLightNavTheme = theme;
      }
    },
    setNavTheme(value: NavTheme): void {
      const next = compatibleNavTheme(this.navMode, value);
      if (next === this.navTheme)
        return;
      this.navTheme = next;
      if (next !== 'header-dark')
        this.lastLightNavTheme = next;
    },
    /** 深浅色切换时同步导航风格 */
    syncNavThemeForDark(isDark: boolean): void {
      if (isDark) {
        if (this.navTheme === 'header-dark')
          return;
        this.lastLightNavTheme = asLightNavTheme(this.navTheme);
        this.navTheme = 'header-dark';
        return;
      }
      if (this.navTheme !== 'header-dark')
        return;
      this.navTheme = compatibleNavTheme(
        this.navMode,
        asLightNavTheme(this.lastLightNavTheme || 'dark'),
      );
    },
    setIsMobile(value: boolean): void {
      if (this.isMobile === value)
        return;
      this.isMobile = value;
    },
    setModalHeaderBgColor(color: string | null | undefined): void {
      this.modalSetting.headerBgColor = normalizeHexColor(color, defaults.modalSetting.headerBgColor);
      this.modalSetting.bgFollowTheme = false;
    },
    setModalHeaderBgFollowTheme(follow: boolean): void {
      this.modalSetting.bgFollowTheme = follow;
      if (follow)
        this.modalSetting.headerBgColor = defaults.modalSetting.headerBgColor;
    },
    setHeaderBgColor(color: string | null | undefined): void {
      this.headerSetting.bgColor = normalizeHexColor(color, defaults.headerSetting.bgColor);
      this.headerSetting.bgFollowTheme = false;
    },
    setHeaderBgFollowTheme(follow: boolean): void {
      this.headerSetting.bgFollowTheme = follow;
      if (follow)
        this.headerSetting.bgColor = defaults.headerSetting.bgColor;
    },
    setTabsBgColor(color: string | null | undefined): void {
      this.multiTabsSetting.bgColor = normalizeHexColor(color, defaults.multiTabsSetting.bgColor);
      this.multiTabsSetting.bgFollowTheme = false;
    },
    setTabsBgFollowTheme(follow: boolean): void {
      this.multiTabsSetting.bgFollowTheme = follow;
      if (follow)
        this.multiTabsSetting.bgColor = defaults.multiTabsSetting.bgColor;
    },
    setLocale(value: AppLocale): void {
      this.locale = resolveAppLocale(value);
    },
    applyPreset(preset: LayoutPreset): void {
      const d = cloneDefaults();
      if (preset === 'classic') {
        this.$patch({
          navMode: 'vertical',
          navTheme: 'dark',
          lastLightNavTheme: 'dark',
          showLogo: true,
          menuSetting: { ...d.menuSetting, collapsed: false, mixMenu: false },
          multiTabsSetting: { ...d.multiTabsSetting, show: true },
          crumbsSetting: { show: true, showIcon: false },
          headerSetting: {
            ...d.headerSetting,
            isReload: true,
            showFullscreen: true,
            showSearch: true,
          },
          contentSetting: { ...d.contentSetting },
        });
      } else if (preset === 'topNav') {
        this.$patch({
          navMode: 'horizontal',
          navTheme: 'dark',
          lastLightNavTheme: 'dark',
          showLogo: true,
          menuSetting: { ...d.menuSetting, mixMenu: false, collapsed: false },
          multiTabsSetting: { ...d.multiTabsSetting, show: true },
          crumbsSetting: { show: false, showIcon: false },
          contentSetting: { ...d.contentSetting },
        });
      } else {
        this.$patch({
          navMode: 'vertical',
          navTheme: 'light',
          lastLightNavTheme: 'light',
          showFooter: false,
          menuSetting: { ...d.menuSetting, collapsed: true, mixMenu: false },
          multiTabsSetting: { ...d.multiTabsSetting, show: false },
          crumbsSetting: { show: false, showIcon: false },
          headerSetting: {
            ...d.headerSetting,
            isReload: false,
            showNotice: false,
            showSearch: true,
          },
          contentSetting: { padding: 16, maxWidth: 0 },
        });
      }
    },
    importSetting(data: Partial<PersistedState>): void {
      const current = this.exportSetting();
      this.$patch(buildPersisted(mergeImportSource(current, data)));
    },
    exportSetting(): PersistedState {
      const { isMobile: _isMobile, ...rest } = this.$state;
      return JSON.parse(JSON.stringify(rest));
    },
    resetSetting(): void {
      this.$patch(cloneDefaults());
    },
  },
});
