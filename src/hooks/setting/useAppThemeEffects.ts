import { watch, watchEffect, onMounted, onUnmounted } from 'vue';

/**
 * web / app 共用：暗色 class、灰/色弱滤镜、跟随系统，以及 projectSetting 持久化。
 * designSetting 仅通过 store action 落盘，不再在此订阅。
 */
export function useAppThemeEffects() {
  const designStore = useDesignSettingStore();
  const projectStore = useProjectSettingStore();

  function applySystemTheme() {
    if (!designStore.followSystem) return;
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    designStore.setDarkTheme(dark);
  }

  function applyBodyFilters() {
    const filters: string[] = [];
    if (designStore.grayMode) filters.push('grayscale(100%)');
    if (designStore.colorWeak) filters.push('invert(80%)');
    document.documentElement.style.filter = filters.length ? filters.join(' ') : '';
  }

  watchEffect(() => {
    const dark = designStore.darkTheme;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    document.body.style.backgroundColor = dark ? '#101014' : '#fff';
    applyBodyFilters();
  });

  watch(
    () => designStore.followSystem,
    (val) => {
      if (val) applySystemTheme();
    },
    { immediate: true },
  );

  let mediaQuery: MediaQueryList | null = null;
  function onSystemThemeChange(e: MediaQueryListEvent) {
    if (designStore.followSystem) {
      designStore.setDarkTheme(e.matches);
    }
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', onSystemThemeChange);
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', onSystemThemeChange);
  });

  // 布局配置大量 v-model 直改 state，统一在此落盘
  projectStore.$subscribe(
    (_mutation, state) => {
      try {
        const { isMobile: _isMobile, ...rest } = state;
        localStorage.setItem('__project_setting__', JSON.stringify(rest));
      } catch {
        // ignore
      }
    },
    { detached: true },
  );
}
