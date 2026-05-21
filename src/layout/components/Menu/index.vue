<template>
  <NMenu
    :options="menuStore.menuOptions"
    :inverted="inverted"
    :mode="mode"
    :collapsed="collapsed"
    :collapsed-width="64"
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
  import { useRoute, useRouter } from 'vue-router';
  import { useProjectSettingStore } from '@/store/modules/projectSetting';
  import { useMenuStore } from '@/store/modules/menu';

  const props = withDefaults(
    defineProps<{
      mode?: 'vertical' | 'horizontal' | 'inline';
      collapsed?: boolean;
      location?: string;
    }>(),
    {
      mode: 'vertical',
      collapsed: false,
      location: 'left',
    },
  );

  const emit = defineEmits(['update:collapsed', 'clickMenuItem']);

  const currentRoute = useRoute();
  const router = useRouter();
  const settingStore = useProjectSettingStore();
  const menuStore = useMenuStore();

  const selectedKey = ref<string | null>(currentRoute.name as string);

  const matched = currentRoute.matched;
  const getOpenKeys = matched?.length ? matched.map((item) => item.name as string) : [];

  const state = reactive({ openKeys: getOpenKeys });

  const inverted = computed(() =>
    ['dark', 'header-dark'].includes(settingStore.navTheme),
  );

  // 跟随路由变化更新选中状态
  watch(
    () => currentRoute.fullPath,
    () => updateSelected(),
  );

  function updateSelected() {
    const matched = currentRoute.matched;
    state.openKeys = matched.map((item) => item.name as string);
    const activeMenu = (currentRoute.meta?.activeMenu as string) || '';
    selectedKey.value = activeMenu || (currentRoute.name as string);
  }

  function clickMenuItem(key: string) {
    if (/^https?:/.test(key)) {
      window.open(key);
    } else {
      router.push({ name: key });
    }
    emit('clickMenuItem', key);
  }

  function menuExpanded(openKeys: string[]) {
    if (!openKeys) return;
    state.openKeys = openKeys;
  }

  onMounted(() => updateSelected());

  const { openKeys } = toRefs(state);
</script>
