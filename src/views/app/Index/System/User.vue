<template>
  <div class="user-page">
    <h2>用户管理</h2>
    <p>这是用户管理页面，需要权限: system:user:list</p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>角色</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const users = ref([
  { id: 1, name: 'admin', role: '管理员', status: '正常' },
  { id: 2, name: 'user1', role: '普通用户', status: '正常' },
  { id: 3, name: 'user2', role: '普通用户', status: '禁用' },
])
</script>

<style scoped>
.user-page {
  padding: 16px;
}

.user-page h2 {
  margin-bottom: 16px;
}

.user-page p {
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
