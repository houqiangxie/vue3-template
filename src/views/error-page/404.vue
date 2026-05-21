<template>
  <div class="error-page">
    <div class="error-content">
      <h1>404</h1>
      <p>页面未找到</p>
      <button @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f5f5f5;
}

.error-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.error-content h1 {
  font-size: 72px;
  margin: 0 0 16px;
  color: #ff4d4f;
}

.error-content p {
  font-size: 18px;
  color: #666;
  margin: 0 0 24px;
}

.error-content button {
  padding: 10px 24px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.error-content button:hover {
  background: #40a9ff;
}
</style>
