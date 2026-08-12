import { defineStore } from 'pinia';
import projectSetting from '@/settings/projectSetting';

const PERSIST_KEY = '__project_setting__';

const {
  navMode,
  navTheme,
  showLogo,
  locale,
  headerSetting,
  modalSetting,
  showFooter,
  menuSetting,
  multiTabsSetting,
  crumbsSetting,
  watermark,
  lockScreen,
  permissionMode,
  isPageAnimate,
  pageAnimateType,
} = projectSetting;

export interface IHeaderSetting {
  bgColor: string;
  fixed: boolean;
  isReload: boolean;
  showFullscreen: boolean;
  showUserInfo: boolean;
  showSearch?: boolean;
  showNotice?: boolean;
}

export interface IModalSetting {
  headerBgColor: string;
}

export interface IMenuSetting {
  minMenuWidth: number;
  menuWidth: number;
  fixed: boolean;
  mixMenu: boolean;
  mobileWidth: number;
  collapsed: boolean;
  accordion: boolean;
  trigger: 'click' | 'hover';
}

export interface IMultiTabsSetting {
  bgColor: string;
  show: boolean;
  fixed: boolean;
  style: 'card' | 'simple' | 'dot';
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

interface ProjectSettingState {
  navMode: string;
  navTheme: string;
  showLogo: boolean;
  locale: 'zh-CN' | 'en-US';
  headerSetting: IHeaderSetting;
  modalSetting: IModalSetting;
  showFooter: boolean;
  menuSetting: IMenuSetting;
  multiTabsSetting: IMultiTabsSetting;
  crumbsSetting: ICrumbsSetting;
  watermark: IWatermarkSetting;
  lockScreen: ILockScreenSetting;
  permissionMode: string;
  isPageAnimate: boolean;
  pageAnimateType: string;
  isMobile: boolean;
}

type PersistedState = Omit<ProjectSettingState, 'isMobile'>;

function cloneDefaults(): PersistedState {
  return {
    navMode,
    navTheme,
    showLogo,
    locale,
    headerSetting: { ...headerSetting },
    modalSetting: { ...modalSetting },
    showFooter,
    menuSetting: { ...menuSetting },
    multiTabsSetting: { ...multiTabsSetting },
    crumbsSetting: { ...crumbsSetting },
    watermark: { ...watermark },
    lockScreen: { ...lockScreen },
    permissionMode,
    isPageAnimate,
    pageAnimateType,
  };
}

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** n-color-picker 只在合法颜色字符串时才会渲染色块/色值 */
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

function mergeHeaderSetting(persisted?: Partial<IHeaderSetting> | null): IHeaderSetting {
  const merged = { ...headerSetting, ...(persisted ?? {}) };
  merged.bgColor = normalizeHexColor(merged.bgColor, headerSetting.bgColor);
  return merged;
}

function mergeMultiTabsSetting(persisted?: Partial<IMultiTabsSetting> | null): IMultiTabsSetting {
  const merged = { ...multiTabsSetting, ...(persisted ?? {}) };
  merged.bgColor = normalizeHexColor(merged.bgColor, multiTabsSetting.bgColor);
  return merged;
}

function mergeModalSetting(persisted?: Partial<IModalSetting> | null): IModalSetting {
  return {
    headerBgColor: normalizeHexColor(
      persisted?.headerBgColor,
      modalSetting.headerBgColor,
    ),
  };
}

function mergeMenuSetting(persisted?: Partial<IMenuSetting>): IMenuSetting {
  return {
    ...menuSetting,
    ...(persisted ?? {}),
  };
}

export const useProjectSettingStore = defineStore('app-project-setting', {
  state: (): ProjectSettingState => {
    const persisted = loadState();
    const defaults = cloneDefaults();
    return {
      navMode: persisted.navMode ?? defaults.navMode,
      navTheme: persisted.navTheme ?? defaults.navTheme,
      showLogo: persisted.showLogo ?? defaults.showLogo,
      locale: persisted.locale ?? defaults.locale,
      headerSetting: mergeHeaderSetting(persisted.headerSetting),
      modalSetting: mergeModalSetting(persisted.modalSetting),
      showFooter: persisted.showFooter ?? defaults.showFooter,
      menuSetting: mergeMenuSetting(persisted.menuSetting),
      multiTabsSetting: mergeMultiTabsSetting(persisted.multiTabsSetting),
      crumbsSetting: { ...defaults.crumbsSetting, ...(persisted.crumbsSetting ?? {}) },
      watermark: { ...defaults.watermark, ...(persisted.watermark ?? {}) },
      lockScreen: { ...defaults.lockScreen, ...(persisted.lockScreen ?? {}) },
      permissionMode: persisted.permissionMode ?? defaults.permissionMode,
      isPageAnimate: persisted.isPageAnimate ?? defaults.isPageAnimate,
      pageAnimateType: persisted.pageAnimateType ?? defaults.pageAnimateType,
      isMobile: false,
    };
  },
  getters: {
    getNavMode(): string {
      return this.navMode;
    },
    getNavTheme(): string {
      return this.navTheme;
    },
    getIsMobile(): boolean {
      return this.isMobile;
    },
    getShowLogo(): boolean {
      return this.showLogo;
    },
    getHeaderSetting(): IHeaderSetting {
      return this.headerSetting;
    },
    getModalSetting(): IModalSetting {
      return this.modalSetting;
    },
    getMenuSetting(): IMenuSetting {
      return this.menuSetting;
    },
    getMultiTabsSetting(): IMultiTabsSetting {
      return this.multiTabsSetting;
    },
    getCrumbsSetting(): ICrumbsSetting {
      return this.crumbsSetting;
    },
    getShowFooter(): boolean {
      return this.showFooter;
    },
    getIsPageAnimate(): boolean {
      return this.isPageAnimate;
    },
    getPageAnimateType(): string {
      return this.pageAnimateType;
    },
  },
  actions: {
    setNavMode(value: string): void {
      this.navMode = value;
      this._persist();
    },
    setNavTheme(value: string): void {
      this.navTheme = value;
      this._persist();
    },
    setIsMobile(value: boolean): void {
      this.isMobile = value;
    },
    setModalHeaderBgColor(color: string | null | undefined): void {
      this.$patch({
        modalSetting: mergeModalSetting({ headerBgColor: color ?? undefined }),
      });
      this._persist();
    },
    setHeaderBgColor(color: string | null | undefined): void {
      this.headerSetting.bgColor = normalizeHexColor(color, headerSetting.bgColor);
      this._persist();
    },
    setTabsBgColor(color: string | null | undefined): void {
      this.multiTabsSetting.bgColor = normalizeHexColor(color, multiTabsSetting.bgColor);
      this._persist();
    },
    importSetting(data: Partial<PersistedState>): void {
      const defaults = cloneDefaults();
      if (data.navMode != null) this.navMode = data.navMode;
      if (data.navTheme != null) this.navTheme = data.navTheme;
      if (data.showLogo != null) this.showLogo = data.showLogo;
      if (data.locale != null) this.locale = data.locale;
      if (data.headerSetting) this.headerSetting = mergeHeaderSetting(data.headerSetting);
      if (data.modalSetting) this.modalSetting = mergeModalSetting(data.modalSetting);
      if (data.showFooter != null) this.showFooter = data.showFooter;
      if (data.menuSetting) this.menuSetting = mergeMenuSetting(data.menuSetting);
      if (data.multiTabsSetting) this.multiTabsSetting = mergeMultiTabsSetting(data.multiTabsSetting);
      if (data.crumbsSetting) this.crumbsSetting = { ...defaults.crumbsSetting, ...data.crumbsSetting };
      if (data.watermark) this.watermark = { ...defaults.watermark, ...data.watermark };
      if (data.lockScreen) this.lockScreen = { ...defaults.lockScreen, ...data.lockScreen };
      if (data.permissionMode != null) this.permissionMode = data.permissionMode;
      if (data.isPageAnimate != null) this.isPageAnimate = data.isPageAnimate;
      if (data.pageAnimateType != null) this.pageAnimateType = data.pageAnimateType;
      this._persist();
    },
    exportSetting(): PersistedState {
      const { isMobile: _isMobile, ...rest } = this.$state;
      return JSON.parse(JSON.stringify(rest));
    },
    resetSetting(): void {
      const defaults = cloneDefaults();
      this.navMode = defaults.navMode;
      this.navTheme = defaults.navTheme;
      this.showLogo = defaults.showLogo;
      this.locale = defaults.locale;
      this.headerSetting = { ...defaults.headerSetting };
      this.modalSetting = { ...defaults.modalSetting };
      this.showFooter = defaults.showFooter;
      this.menuSetting = { ...defaults.menuSetting };
      this.multiTabsSetting = { ...defaults.multiTabsSetting };
      this.crumbsSetting = { ...defaults.crumbsSetting };
      this.watermark = { ...defaults.watermark };
      this.lockScreen = { ...defaults.lockScreen };
      this.permissionMode = defaults.permissionMode;
      this.isPageAnimate = defaults.isPageAnimate;
      this.pageAnimateType = defaults.pageAnimateType;
      this._persist();
    },
    _persist() {
      const { isMobile: _isMobile, ...rest } = this.$state;
      localStorage.setItem(PERSIST_KEY, JSON.stringify(rest));
    },
  },
});
