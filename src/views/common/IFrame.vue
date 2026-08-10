<template>
  <iframe
    class="h-full w-full border-0"
    :src="url"
    frameborder="0"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const url = computed(() => String(route.meta?.iFrameUrl || ''))
</script>
