<template>
  <div class="system-layout">
    <div class="system-sidebar">
      <ul>
        <li v-for="child in children" :key="child.name">
          <router-link :to="child.path">{{ child.meta?.title }}</router-link>
        </li>
      </ul>
    </div>
    <div class="system-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const children = route.children || []
</script>

<style scoped>
.system-layout {
  display: flex;
  height: 100%;
}

.system-sidebar {
  width: 200px;
  background: #f5f5f5;
  padding: 16px;
}

.system-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.system-sidebar li {
  margin-bottom: 8px;
}

.system-sidebar a {
  display: block;
  padding: 8px 12px;
  text-decoration: none;
  color: #333;
  border-radius: 4px;
  transition: background 0.2s;
}

.system-sidebar a:hover {
  background: #e0e0e0;
}

.system-content {
  flex: 1;
  padding: 16px;
}
</style>
