import { defineStore } from 'pinia';
import designSetting from '@/settings/designSetting';

const PERSIST_KEY = '__design_setting__';

const {
  darkTheme,
  followSystem,
  appTheme,
  appThemeList,
  grayMode,
  colorWeak,
  borderRadius,
  compact,
} = designSetting;

interface DesignSettingState {
  darkTheme: boolean;
  followSystem: boolean;
  appTheme: string;
  appThemeList: string[];
  grayMode: boolean;
  colorWeak: boolean;
  borderRadius: number;
  compact: boolean;
}

type PersistedDesign = Omit<DesignSettingState, 'appThemeList'>;

function loadState(): Partial<PersistedDesign> {
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
      followSystem: persisted.followSystem ?? followSystem,
      appTheme: persisted.appTheme ?? appTheme,
      appThemeList,
      grayMode: persisted.grayMode ?? grayMode,
      colorWeak: persisted.colorWeak ?? colorWeak,
      borderRadius: persisted.borderRadius ?? borderRadius,
      compact: persisted.compact ?? compact,
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
    setFollowSystem(val: boolean) {
      this.followSystem = val;
      this._persist();
    },
    setAppTheme(val: string) {
      this.appTheme = val;
      this._persist();
    },
    setGrayMode(val: boolean) {
      this.grayMode = val;
      this._persist();
    },
    setColorWeak(val: boolean) {
      this.colorWeak = val;
      this._persist();
    },
    setBorderRadius(val: number) {
      this.borderRadius = val;
      this._persist();
    },
    setCompact(val: boolean) {
      this.compact = val;
      this._persist();
    },
    importSetting(data: Partial<PersistedDesign>) {
      if (data.darkTheme != null) this.darkTheme = data.darkTheme;
      if (data.followSystem != null) this.followSystem = data.followSystem;
      if (data.appTheme != null) this.appTheme = data.appTheme;
      if (data.grayMode != null) this.grayMode = data.grayMode;
      if (data.colorWeak != null) this.colorWeak = data.colorWeak;
      if (data.borderRadius != null) this.borderRadius = data.borderRadius;
      if (data.compact != null) this.compact = data.compact;
      this._persist();
    },
    exportSetting(): PersistedDesign {
      return {
        darkTheme: this.darkTheme,
        followSystem: this.followSystem,
        appTheme: this.appTheme,
        grayMode: this.grayMode,
        colorWeak: this.colorWeak,
        borderRadius: this.borderRadius,
        compact: this.compact,
      };
    },
    resetSetting() {
      this.darkTheme = darkTheme;
      this.followSystem = followSystem;
      this.appTheme = appTheme;
      this.grayMode = grayMode;
      this.colorWeak = colorWeak;
      this.borderRadius = borderRadius;
      this.compact = compact;
      this._persist();
    },
    _persist() {
      localStorage.setItem(
        PERSIST_KEY,
        JSON.stringify({
          darkTheme: this.darkTheme,
          followSystem: this.followSystem,
          appTheme: this.appTheme,
          grayMode: this.grayMode,
          colorWeak: this.colorWeak,
          borderRadius: this.borderRadius,
          compact: this.compact,
        }),
      );
    },
  },
});
