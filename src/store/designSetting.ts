import { defineStore } from 'pinia';
import type { GlobalThemeOverrides } from 'naive-ui';
import designSetting from '@/settings/designSetting';
import {
  clearThemeEditorOverrides,
  readThemeEditorOverrides,
  writeThemeEditorOverrides,
} from '@/utils/theme';

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
  showThemeEditor,
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
  showThemeEditor: boolean;
  /** 与 NThemeEditor 的 localStorage 同步，关闭编辑器后仍应用到全局 */
  themeEditorOverrides: GlobalThemeOverrides;
  /** 导入配置后强制重挂载编辑器 */
  themeEditorEpoch: number;
}

/** 持久化字段（不持久化编辑器开关，刷新后默认关闭） */
type PersistedDesign = Omit<
  DesignSettingState,
  'appThemeList' | 'themeEditorOverrides' | 'themeEditorEpoch' | 'showThemeEditor'
>;

function loadState(): Partial<PersistedDesign> {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<PersistedDesign> & { showThemeEditor?: boolean };
    const { showThemeEditor: _showThemeEditor, ...rest } = parsed;
    return rest;
  } catch {
    return {};
  }
}

function persistPayload(state: DesignSettingState): PersistedDesign {
  return {
    darkTheme: state.darkTheme,
    followSystem: state.followSystem,
    appTheme: state.appTheme,
    grayMode: state.grayMode,
    colorWeak: state.colorWeak,
    borderRadius: state.borderRadius,
    compact: state.compact,
  };
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
      showThemeEditor,
      themeEditorOverrides: readThemeEditorOverrides(),
      themeEditorEpoch: 0,
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
    setShowThemeEditor(val: boolean) {
      if (!val) {
        this.syncThemeEditorOverridesFromStorage();
      }
      this.showThemeEditor = val;
    },
    syncThemeEditorOverridesFromStorage() {
      this.themeEditorOverrides = readThemeEditorOverrides();
    },
    setThemeEditorOverrides(overrides: GlobalThemeOverrides) {
      this.themeEditorOverrides = overrides ?? {};
      writeThemeEditorOverrides(this.themeEditorOverrides);
      this.themeEditorEpoch += 1;
    },
    clearThemeEditorOverrides() {
      this.themeEditorOverrides = {};
      clearThemeEditorOverrides();
      this.themeEditorEpoch += 1;
    },
    importSetting(
      data: Partial<PersistedDesign> & {
        showThemeEditor?: boolean;
        themeEditorOverrides?: GlobalThemeOverrides;
      },
    ) {
      if (data.darkTheme != null) this.darkTheme = data.darkTheme;
      if (data.followSystem != null) this.followSystem = data.followSystem;
      if (data.appTheme != null) this.appTheme = data.appTheme;
      if (data.grayMode != null) this.grayMode = data.grayMode;
      if (data.colorWeak != null) this.colorWeak = data.colorWeak;
      if (data.borderRadius != null) this.borderRadius = data.borderRadius;
      if (data.compact != null) this.compact = data.compact;
      // 导入时也尊重入口状态；日常刷新不恢复
      if (data.showThemeEditor != null) this.showThemeEditor = data.showThemeEditor;
      if (data.themeEditorOverrides != null) {
        this.setThemeEditorOverrides(data.themeEditorOverrides);
      } else {
        this.syncThemeEditorOverridesFromStorage();
      }
      this._persist();
    },
    exportSetting(): PersistedDesign & {
      showThemeEditor: boolean;
      themeEditorOverrides: GlobalThemeOverrides;
    } {
      this.syncThemeEditorOverridesFromStorage();
      return {
        ...persistPayload(this.$state),
        showThemeEditor: this.showThemeEditor,
        themeEditorOverrides: this.themeEditorOverrides,
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
      this.showThemeEditor = showThemeEditor;
      this.clearThemeEditorOverrides();
      this._persist();
    },
    _persist() {
      try {
        localStorage.setItem(PERSIST_KEY, JSON.stringify(persistPayload(this.$state)));
      } catch {
        // ignore quota / private mode
      }
    },
  },
});
