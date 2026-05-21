<template>
  <div class="menu-page">
    <h2>菜单管理</h2>
    <p>这是菜单管理页面，需要权限: system:menu:list</p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>菜单名称</th>
          <th>路由路径</th>
          <th>组件路径</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="menu in menus" :key="menu.id">
          <td>{{ menu.id }}</td>
          <td>{{ menu.name }}</td>
          <td>{{ menu.path }}</td>
          <td>{{ menu.component }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const menus = ref([
  { id: 1, name: '首页', path: '/', component: 'app/Index' },
  { id: 2, name: '控制台', path: '/home/homeindex', component: 'app/Index/Home/HomeIndex' },
  { id: 3, name: '用户管理', path: '/home/system/user', component: 'app/Index/System/User' },
])
</script>

<style scoped>
.menu-page {
  padding: 16px;
}

.menu-page h2 {
  margin-bottom: 16px;
}

.menu-page p {
  color: #666;
  margin-bottom: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th,
table td {
  padding: 8px 12px;
  border: 1px solid #ddd;
  text-align: left;
}

table th {
  background: #f5f5f5;
}
</style>
