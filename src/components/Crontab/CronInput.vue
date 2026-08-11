<template>
  <div class="cron-input">
    <n-input-group>
      <n-input
        v-model:value="value"
        placeholder="请输入 cron 执行表达式"
        clearable
      />
      <n-button type="primary" @click="showModal = true">
        生成表达式
      </n-button>
    </n-input-group>

    <CommonModal
      v-model:show="showModal"
      title="Cron 表达式生成器"
      :width="780"
      :show-footer="false"
      :mask-closable="false"
      :z-index="4000"
      destroy-on-close
    >
      <Crontab
        v-if="showModal"
        :expression="value || ''"
        @fill="onFill"
        @hide="onHide"
      />
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NInputGroup } from 'naive-ui'
import CommonModal from '@/components/common/modal/CommonModal.vue'
import Crontab from './index.vue'

const value = defineModel<string>('value', { default: '' })
const showModal = ref(false)

function onFill(cron: string) {
  value.value = cron
  showModal.value = false
}

function onHide() {
  showModal.value = false
}
</script>

<style scoped>
.cron-input {
  width: 100%;
}
</style>
