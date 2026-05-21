<template>
  <div class="role-page">
    <h2>角色管理</h2>
    <p>这是角色管理页面，需要权限: system:role:list</p>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>角色名称</th>
          <th>角色标识</th>
          <th>描述</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in roles" :key="role.id">
          <td>{{ role.id }}</td>
          <td>{{ role.name }}</td>
          <td>{{ role.code }}</td>
          <td>{{ role.description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const roles = ref([
  { id: 1, name: '管理员', code: 'admin', description: '系统管理员' },
  { id: 2, name: '普通用户', code: 'user', description: '普通用户' },
  { id: 3, name: '访客', code: 'guest', description: '访客权限' },
])
</script>

<style scoped>
.role-page {
  padding: 16px;
}

.role-page h2 {
  margin-bottom: 16px;
}

.role-page p {
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
