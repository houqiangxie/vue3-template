import { defineStore } from 'pinia';
import type { GlobalThemeOverrides } from 'naive-ui';
import { local } from 'ux-web-storage';
import designSetting from '@/settings/designSetting';
import { normalizeHexColor } from '@/utils/layout';
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
  themeEditorOverrides: GlobalThemeOverrides;
  themeEditorEpoch: number;
}

/** 可移植配置（不含会话态 showThemeEditor） */
export type PersistedDesign = Omit<
  DesignSettingState,
  'appThemeList' | 'themeEditorOverrides' | 'themeEditorEpoch' | 'showThemeEditor'
>;

function loadState(): Partial<PersistedDesign> {
  try {
    const cached = local[PERSIST_KEY] as
      | (Partial<PersistedDesign> & { showThemeEditor?: boolean })
      | undefined;
    if (!cached || typeof cached !== 'object')
      return {};
    const { showThemeEditor: _showThemeEditor, ...rest } = cached;
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

function clampRadius(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n))
    return borderRadius;
  return Math.min(16, Math.max(0, Math.round(n)));
}

let lastPersistedPayload = '';

export function persistDesignSetting(state: DesignSettingState) {
  try {
    const data = persistPayload(state);
    const payload = JSON.stringify(data);
    if (payload === lastPersistedPayload)
      return;
    lastPersistedPayload = payload;
    local[PERSIST_KEY] = data;
  } catch {
    // ignore
  }
}

export function clearDesignSettingPersistCache() {
  lastPersistedPayload = '';
}

export const useDesignSettingStore = defineStore('app-design-setting', {
  state: (): DesignSettingState => {
    const persisted = loadState();
    return {
      darkTheme: persisted.darkTheme ?? darkTheme,
      followSystem: persisted.followSystem ?? followSystem,
      appTheme: normalizeHexColor(persisted.appTheme ?? appTheme, appTheme),
      appThemeList,
      grayMode: persisted.grayMode ?? grayMode,
      colorWeak: persisted.colorWeak ?? colorWeak,
      borderRadius: clampRadius(persisted.borderRadius ?? borderRadius),
      compact: persisted.compact ?? compact,
      showThemeEditor,
      themeEditorOverrides: readThemeEditorOverrides(),
      themeEditorEpoch: 0,
    };
  },
  actions: {
    setDarkTheme(val: boolean) {
      if (this.darkTheme === val)
        return;
      this.darkTheme = val;
    },
    setFollowSystem(val: boolean) {
      if (this.followSystem === val)
        return;
      this.followSystem = val;
    },
    setAppTheme(val: string) {
      this.appTheme = normalizeHexColor(val, appTheme);
    },
    setGrayMode(val: boolean) {
      this.grayMode = val;
    },
    setColorWeak(val: boolean) {
      this.colorWeak = val;
    },
    setBorderRadius(val: number) {
      this.borderRadius = clampRadius(val);
    },
    setCompact(val: boolean) {
      this.compact = val;
    },
    setShowThemeEditor(val: boolean) {
      if (!val)
        this.syncThemeEditorOverridesFromStorage();
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
      if (data.darkTheme != null)
        this.darkTheme = data.darkTheme;
      if (data.followSystem != null)
        this.followSystem = data.followSystem;
      if (data.appTheme != null)
        this.appTheme = normalizeHexColor(data.appTheme, appTheme);
      if (data.grayMode != null)
        this.grayMode = data.grayMode;
      if (data.colorWeak != null)
        this.colorWeak = data.colorWeak;
      if (data.borderRadius != null)
        this.borderRadius = clampRadius(data.borderRadius);
      if (data.compact != null)
        this.compact = data.compact;
      // showThemeEditor 为会话态，导入时忽略
      if (data.themeEditorOverrides != null)
        this.setThemeEditorOverrides(data.themeEditorOverrides);
      else
        this.syncThemeEditorOverridesFromStorage();
    },
    exportSetting(): PersistedDesign & {
      themeEditorOverrides: GlobalThemeOverrides;
    } {
      this.syncThemeEditorOverridesFromStorage();
      return {
        ...persistPayload(this.$state),
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
    },
  },
});
