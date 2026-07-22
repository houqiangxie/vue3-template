<template>
  <Layout />
</template>

<script setup lang="ts">
import { h, onMounted } from 'vue';
import { NIcon } from 'naive-ui';
import { HomeOutlined, UserOutlined } from '@vicons/antd';
import Layout from '@/layout/index.vue';
import { useMenuStore } from '@/store/modules/menu';

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuStore = useMenuStore();

onMounted(() => {
  menuStore.setMenuOptions([
    {
      label: '系统首页',
      key: 'Index-Home',
      icon: renderIcon(HomeOutlined),
      children: [
        {
          label: '首页',
          key: 'Index-Home-HomeIndex',
        },
        {
          label: 'Modal 示例',
          key: 'Index-Home-ModalDemo',
        },
        {
          label: '个人信息',
          key: 'Index-Home-PersonInfo',
        },
      ],
    },
  ]);
});
</script>
