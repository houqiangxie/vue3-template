import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { MenuOption } from 'naive-ui';

/**
 * 菜单 store
 * 可在此处配置菜单项，也可以通过 setMenuOptions 动态设置
 */
export const useMenuStore = defineStore('app-menu', () => {
  const menuOptions = ref<MenuOption[]>([]);

  function setMenuOptions(options: MenuOption[]) {
    menuOptions.value = options;
  }

  return { menuOptions, setMenuOptions };
});
