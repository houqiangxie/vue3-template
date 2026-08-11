<template>
  <NMenu
    :options="menus"
    :inverted="inverted"
    :mode="mode"
    :collapsed="collapsed"
    :collapsed-width="settingStore.menuSetting.minMenuWidth"
    :collapsed-icon-size="20"
    :indent="24"
    :expanded-keys="openKeys"
    :value="selectedKey"
    @update:value="clickMenuItem"
    @update:expanded-keys="menuExpanded"
  />
</template>

<script lang="ts" setup>
  import { ref, computed, watch, onMounted, reactive, toRefs } from 'vue';
  import type { MenuOption } from 'naive-ui';
  import { useRoute, useRouter } from 'vue-router';
  import { useProjectSettingStore } from '@/store/modules/projectSetting';
  import { useMenuStore } from '@/store/modules/menu';

  const props = withDefaults(
    defineProps<{
      mode?: 'vertical' | 'horizontal' | 'inline';
      collapsed?: boolean;
      location?: string;
      inverted?: boolean;
    }>(),
    {
      mode: 'vertical',
      collapsed: false,
      location: 'left',
      inverted: undefined,
    },
  );

  const emit = defineEmits(['update:collapsed', 'clickMenuItem']);

  const currentRoute = useRoute();
  const router = useRouter();
  const settingStore = useProjectSettingStore();
  const menuStore = useMenuStore();

  const menus = ref<MenuOption[]>([]);
  const selectedKey = ref<string | null>(currentRoute.name as string);

  const matched = currentRoute.matched;
  const state = reactive({
    openKeys: matched?.length ? matched.map((item) => item.name as string) : ([] as string[]),
  });

  const inverted = computed(() => {
    if (typeof props.inverted === 'boolean') return props.inverted;
    return ['dark', 'header-dark'].includes(settingStore.navTheme);
  });

  function toHeaderMenus(options: MenuOption[]): MenuOption[] {
    return options.map(({ children: _c, ...rest }) => ({ ...rest }));
  }

  function toLeftMixMenus(options: MenuOption[], topKey: string): MenuOption[] {
    const parent = options.find((item) => String(item.key) === topKey);
    return (parent?.children as MenuOption[]) ?? [];
  }

  function firstLeafKey(option: MenuOption | undefined): string | null {
    if (!option) return null;
    if (!option.children?.length) return option.key != null ? String(option.key) : null;
    return firstLeafKey(option.children[0] as MenuOption);
  }

  function containsMenuKey(options: MenuOption[] | undefined, key: string): boolean {
    if (!options?.length)
      return false
    return options.some((item) => {
      if (String(item.key) === key)
        return true
      return containsMenuKey(item.children as MenuOption[] | undefined, key)
    })
  }

  /** 从侧栏树查找目标 key 的祖先 keys（不含自身），用于展开 ParentView 扁平后的目录 */
  function findAncestorKeys(
    options: MenuOption[] | undefined,
    target: string,
    trail: string[] = [],
  ): string[] | null {
    if (!options?.length)
      return null
    for (const item of options) {
      const key = item.key != null ? String(item.key) : ''
      if (key === target)
        return trail
      if (item.children?.length) {
        const next = key ? [...trail, key] : trail
        const found = findAncestorKeys(item.children as MenuOption[], target, next)
        if (found)
          return found
      }
    }
    return null
  }

  /** 跳过 Layout 等外壳；扁平路由下从侧栏树反查一级菜单 key */
  function getTopRouteKey(): string {
    const all = menuStore.menuOptions as MenuOption[]
    const explicit = (currentRoute.meta?.activeMenu as string) || ''
    if (explicit && all.some(item => String(item.key) === explicit))
      return explicit

    const routeName = currentRoute.name ? String(currentRoute.name) : ''
    if (routeName) {
      for (const item of all) {
        const topKey = item.key != null ? String(item.key) : ''
        if (!topKey)
          continue
        if (topKey === routeName || containsMenuKey(item.children as MenuOption[], routeName))
          return topKey
      }
    }

    const matchedRoutes = currentRoute.matched.filter(r => r.name && r.name !== 'Layout')
    const top = matchedRoutes[0]
    if (top?.name)
      return String(top.name)

    const first = all[0]
    return first?.key != null ? String(first.key) : ''
  }

  function updateSelected() {
    const all = menuStore.menuOptions as MenuOption[]
    const activeMenu = (currentRoute.meta?.activeMenu as string) || ''
    const routeName = currentRoute.name ? String(currentRoute.name) : ''

    // 隐藏页可通过 meta.activeMenu 高亮其它侧栏项；普通页用自身 name
    const highlightKey = (activeMenu && containsMenuKey(all, activeMenu))
      ? activeMenu
      : routeName

    if (settingStore.menuSetting.mixMenu && props.location === 'header')
      selectedKey.value = getTopRouteKey()
    else
      selectedKey.value = highlightKey

    const ancestors = findAncestorKeys(all, highlightKey) || []
    state.openKeys = ancestors.length
      ? ancestors
      : currentRoute.matched.map(item => item.name as string).filter(Boolean)
  }

  function updateMenu() {
    const all = menuStore.menuOptions as MenuOption[];
    const mix = settingStore.menuSetting.mixMenu;

    if (!mix) {
      menus.value = all;
    } else if (props.location === 'header') {
      menus.value = toHeaderMenus(all);
    } else {
      menus.value = toLeftMixMenus(all, getTopRouteKey());
    }
    updateSelected();
  }

  watch(() => currentRoute.fullPath, updateMenu);
  watch(() => settingStore.menuSetting.mixMenu, () => {
    updateMenu();
    if (props.collapsed) emit('update:collapsed', false);
  });
  watch(() => menuStore.menuOptions, updateMenu, { deep: true });
  watch(() => props.location, updateMenu);

  function clickMenuItem(key: string) {
    if (/^https?:/.test(key)) {
      window.open(key);
      return;
    }

    if (settingStore.menuSetting.mixMenu && props.location === 'header') {
      const parent = (menuStore.menuOptions as MenuOption[]).find(
        (item) => String(item.key) === key,
      );
      const leaf = firstLeafKey(parent) || key;
      router.push({ name: leaf });
    } else {
      router.push({ name: key });
    }
    emit('clickMenuItem', key);
  }

  function menuExpanded(keys: string[]) {
    if (!keys) return;
    if (!settingStore.menuSetting.accordion) {
      state.openKeys = keys;
      return;
    }
    // 手风琴：只保留最新展开的一级菜单
    const latest = keys.find((key) => !state.openKeys.includes(key));
    if (!latest) {
      state.openKeys = keys;
      return;
    }
    const hasChildren = menus.value.some(
      (item) => String(item.key) === latest && !!item.children?.length,
    );
    state.openKeys = hasChildren ? [latest] : keys;
  }

  onMounted(() => updateMenu());

  const { openKeys } = toRefs(state);
</script>
