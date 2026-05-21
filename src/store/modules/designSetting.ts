import { defineStore } from 'pinia';
import designSetting from '@/settings/designSetting';

const PERSIST_KEY = '__design_setting__';

const { darkTheme, appTheme, appThemeList } = designSetting;

interface DesignSettingState {
  darkTheme: boolean;
  appTheme: string;
  appThemeList: string[];
}

function loadState(): Partial<Pick<DesignSettingState, 'darkTheme' | 'appTheme'>> {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const useDesignSettingStore = defineStore('app-design-setting', {
  state: (): DesignSettingState => {
    const persisted = loadState();
    return {
      darkTheme: persisted.darkTheme ?? darkTheme,
      appTheme: persisted.appTheme ?? appTheme,
      appThemeList,
    };
  },
  getters: {
    getDarkTheme(): boolean {
      return this.darkTheme;
    },
    getAppTheme(): string {
      return this.appTheme;
    },
    getAppThemeList(): string[] {
      return this.appThemeList;
    },
  },
  actions: {
    setDarkTheme(val: boolean) {
      this.darkTheme = val;
      this._persist();
    },
    setAppTheme(val: string) {
      this.appTheme = val;
      this._persist();
    },
    _persist() {
      localStorage.setItem(
        PERSIST_KEY,
        JSON.stringify({ darkTheme: this.darkTheme, appTheme: this.appTheme }),
      );
    },
  },
});
