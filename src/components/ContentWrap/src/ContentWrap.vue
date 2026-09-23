<script lang="ts" setup>
defineOptions({ name: 'ContentWrap' })

withDefaults(defineProps<{
  title?: string
  message?: string
  bodyStyle?: Record<string, string>
}>(), {
  title: '',
  message: '',
  bodyStyle: () => ({ padding: '10px' }),
})
</script>

<template>
  <n-card class="mb-15px" :content-style="bodyStyle" :bordered="true" size="small">
    <template v-if="title" #header>
      <div class="flex items-center">
        <span class="text-16px font-700">{{ title }}</span>
        <span v-if="message" class="ml-5px text-12px text-gray-400">{{ message }}</span>
        <div class="flex flex-grow pl-20px">
          <slot name="header" />
        </div>
      </div>
    </template>
    <slot />
  </n-card>
</template>
