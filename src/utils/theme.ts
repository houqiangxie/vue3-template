import type { GlobalThemeOverrides } from 'naive-ui';
import { darken, lighten } from '@/utils/layout';

/** 与 naive-ui NThemeEditor 使用同一持久化键，保证编辑结果可互通 */
export const NAIVE_THEME_EDITOR_KEY = 'naive-ui-theme-overrides';

export function readThemeEditorOverrides(): GlobalThemeOverrides {
  try {
    return JSON.parse(localStorage.getItem(NAIVE_THEME_EDITOR_KEY) || '{}') as GlobalThemeOverrides;
  } catch {
    return {};
  }
}

export function writeThemeEditorOverrides(overrides: GlobalThemeOverrides) {
  localStorage.setItem(NAIVE_THEME_EDITOR_KEY, JSON.stringify(overrides ?? {}));
}

export function clearThemeEditorOverrides() {
  localStorage.removeItem(NAIVE_THEME_EDITOR_KEY);
}

export function deepMergeThemeOverrides(
  target: GlobalThemeOverrides,
  source?: GlobalThemeOverrides | null,
): GlobalThemeOverrides {
  if (!source) return { ...target };
  const out: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = (source as Record<string, unknown>)[key];
    const tv = out[key];
    if (
      sv
      && typeof sv === 'object'
      && !Array.isArray(sv)
      && tv
      && typeof tv === 'object'
      && !Array.isArray(tv)
    ) {
      out[key] = deepMergeThemeOverrides(
        tv as GlobalThemeOverrides,
        sv as GlobalThemeOverrides,
      );
    } else if (sv !== undefined) {
      out[key] = sv;
    }
  }
  return out as GlobalThemeOverrides;
}

export function buildDesignThemeOverrides(options: {
  appTheme: string;
  borderRadius: number;
  compact: boolean;
}): GlobalThemeOverrides {
  const { appTheme, borderRadius, compact } = options;
  const hover = lighten(appTheme, 6);
  const pressed = darken(appTheme, 6);
  const radius = `${borderRadius}px`;
  return {
    common: {
      primaryColor: appTheme,
      primaryColorHover: hover,
      primaryColorPressed: pressed,
      primaryColorSuppl: appTheme,
      borderRadius: radius,
      borderRadiusSmall: radius,
      heightMedium: compact ? '28px' : undefined,
      heightSmall: compact ? '22px' : undefined,
      fontSize: compact ? '13px' : undefined,
    },
    Button: compact
      ? {
          heightMedium: '28px',
          heightSmall: '22px',
          fontSizeMedium: '13px',
        }
      : undefined,
    DataTable: compact
      ? {
          thPaddingMedium: '8px',
          tdPaddingMedium: '8px',
        }
      : undefined,
  };
}
