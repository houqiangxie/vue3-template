import { defineStore } from 'pinia';
import projectSetting from '@/settings/projectSetting';

const PERSIST_KEY = '__project_setting__';

const {
  navMode,
  navTheme,
  isMobile,
  headerSetting,
  showFooter,
  menuSetting,
  multiTabsSetting,
  crumbsSetting,
  permissionMode,
  isPageAnimate,
  pageAnimateType,
} = projectSetting;

export interface IHeaderSetting {
  bgColor: string;
  fixed: boolean;
  isReload: boolean;
}

export interface IMenuSetting {
  minMenuWidth: number;
  menuWidth: number;
  fixed: boolean;
  mixMenu: boolean;
  mobileWidth: number;
  collapsed: boolean;
}

export interface IMultiTabsSetting {
  bgColor: string;
  show: boolean;
  fixed: boolean;
}

export interface ICrumbsSetting {
  show: boolean;
  showIcon: boolean;
}

interface ProjectSettingState {
  navMode: string;
  navTheme: string;
  headerSetting: IHeaderSetting;
  showFooter: boolean;
  menuSetting: IMenuSetting;
  multiTabsSetting: IMultiTabsSetting;
  crumbsSetting: ICrumbsSetting;
  permissionMode: string;
  isPageAnimate: boolean;
  pageAnimateType: string;
  isMobile: boolean;
}

type PersistedState = Omit<ProjectSettingState, 'isMobile'>;

function loadState(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const useProjectSettingStore = defineStore('app-project-setting', {
  state: (): ProjectSettingState => {
    const persisted = loadState();
    return {
      navMode: persisted.navMode ?? navMode,
      navTheme: persisted.navTheme ?? navTheme,
      headerSetting: persisted.headerSetting ?? headerSetting,
      showFooter: persisted.showFooter ?? showFooter,
      menuSetting: persisted.menuSetting ?? menuSetting,
      multiTabsSetting: persisted.multiTabsSetting ?? multiTabsSetting,
      crumbsSetting: persisted.crumbsSetting ?? crumbsSetting,
      permissionMode: persisted.permissionMode ?? permissionMode,
      isPageAnimate: persisted.isPageAnimate ?? isPageAnimate,
      pageAnimateType: persisted.pageAnimateType ?? pageAnimateType,
      // isMobile 不持久化，始终使用默认值
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
    getHeaderSetting(): IHeaderSetting {
      return this.headerSetting;
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
      // 不持久化移动端状态
      this.isMobile = value;
    },
    _persist() {
      const { isMobile: _isMobile, ...rest } = this.$state;
      localStorage.setItem(PERSIST_KEY, JSON.stringify(rest));
    },
  },
});
