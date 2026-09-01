import { ref, watch, watchEffect, onMounted, onUnmounted } from 'vue';
import { persistProjectSetting } from '@/store/projectSetting';
import { persistDesignSetting } from '@/store/designSetting';

/** HMR / 重复调用时避免叠加 $subscribe */
let projectPersistSubscribed = false;
let designPersistSubscribed = false;

/** 系统「减少动效」——供路由动画等共享，避免多处重复监听 */
export const systemReduceMotion = ref(false);

export interface AppThemeEffectsOptions {
  /**
   * 是否持久化 projectSetting（导航模式、侧栏、页脚等布局配置）。
   * 仅 web 后台需要；App/H5 预留入口传 false。
   * @default true
   */
  persistProjectSetting?: boolean;
}

/**
 * 暗色 class、灰/色弱滤镜、跟随系统。
 * 灰/色弱通过 html class 控制，样式落在 `.app-shell`。
 * projectSetting 持久化默认开启（web）；App 入口应关闭。
 * designSetting 始终通过 $subscribe 持久化。
 */
export function useAppThemeEffects(options: AppThemeEffectsOptions = {}) {
  const { persistProjectSetting: shouldPersistProject = true } = options;
  const designStore = useDesignSettingStore();
  const projectStore = useProjectSettingStore();

  function applySystemTheme() {
    if (!designStore.followSystem)
      return;
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (designStore.darkTheme !== dark)
      designStore.setDarkTheme(dark);
  }

  watchEffect(() => {
    const dark = designStore.darkTheme;
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.classList.toggle('gray-mode', designStore.grayMode);
    root.classList.toggle('color-weak', designStore.colorWeak);
    root.style.colorScheme = dark ? 'dark' : 'light';
    document.body.style.backgroundColor = dark ? '#101014' : '#fff';
  });

  watch(
    () => designStore.darkTheme,
    dark => projectStore.syncNavThemeForDark(dark),
    { immediate: true },
  );

  watch(
    () => designStore.followSystem,
    val => {
      if (val)
        applySystemTheme();
    },
    { immediate: true },
  );

  let mediaQuery: MediaQueryList | null = null;
  let motionQuery: MediaQueryList | null = null;

  function onSystemThemeChange(e: MediaQueryListEvent) {
    if (designStore.followSystem)
      designStore.setDarkTheme(e.matches);
  }

  function onReducedMotionChange(e: MediaQueryListEvent) {
    systemReduceMotion.value = e.matches;
    document.documentElement.classList.toggle('reduce-motion', e.matches);
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', onSystemThemeChange);

    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    systemReduceMotion.value = motionQuery.matches;
    document.documentElement.classList.toggle('reduce-motion', motionQuery.matches);
    motionQuery.addEventListener('change', onReducedMotionChange);
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', onSystemThemeChange);
    motionQuery?.removeEventListener('change', onReducedMotionChange);
  });

  if (!designPersistSubscribed) {
    designPersistSubscribed = true;
    designStore.$subscribe((_mutation, state) => {
      persistDesignSetting(state);
    }, { detached: true });
  }

  if (shouldPersistProject && !projectPersistSubscribed) {
    projectPersistSubscribed = true;
    projectStore.$subscribe((_mutation, state) => {
      persistProjectSetting(state);
    }, { detached: true });
  }
}
