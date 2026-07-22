<template>
  <n-modal
    v-if="inElectron"
    v-model:show="visible"
    preset="dialog"
    :title="dialogTitle"
    :mask-closable="!isDownloading"
    :close-on-esc="!isDownloading"
    :show-icon="false"
    style="width: 420px"
  >
    <div class="app-updater">
      <p v-if="status.currentVersion" class="app-updater__meta">
        当前版本：{{ status.currentVersion }}
      </p>
      <p v-if="status.version && hasUpdate" class="app-updater__meta">
        发现新版本：{{ status.version }}
      </p>
      <p v-if="hasUpdate && !isDownloading && !isDownloaded" class="app-updater__desc">
        检测到可用更新。下载时将优先使用增量包（Windows blockmap），失败时自动回退全量安装包。
      </p>
      <p v-if="isDownloaded" class="app-updater__desc">
        更新已下载完成，重启应用后即可生效。
      </p>
      <p v-if="hasError" class="app-updater__error">
        {{ status.error || '检查更新失败' }}
      </p>
      <n-progress
        v-if="isDownloading"
        type="line"
        :percentage="progressPercent"
        indicator-placement="inside"
        processing
      />
    </div>

    <template #action>
      <n-space>
        <n-button v-if="!isDownloading && !isDownloaded" @click="dismiss">
          稍后
        </n-button>
        <n-button
          v-if="hasUpdate && !isDownloading && !isDownloaded"
          type="primary"
          @click="downloadUpdate"
        >
          立即下载
        </n-button>
        <n-button
          v-if="isDownloaded"
          type="primary"
          @click="quitAndInstall"
        >
          重启并安装
        </n-button>
        <n-button
          v-if="hasError"
          type="primary"
          @click="checkForUpdates"
        >
          重试
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppUpdater } from '@/hooks/useAppUpdater';

const {
  inElectron,
  status,
  visible,
  hasUpdate,
  isDownloading,
  isDownloaded,
  hasError,
  progressPercent,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
  dismiss,
} = useAppUpdater();

const dialogTitle = computed(() => {
  if (isDownloading.value) {
    return '正在下载更新';
  }
  if (isDownloaded.value) {
    return '更新已就绪';
  }
  if (hasError.value) {
    return '更新失败';
  }
  return '发现新版本';
});
</script>

<style scoped lang="scss">
.app-updater {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-updater__meta {
  margin: 0;
  color: var(--n-text-color-2);
}

.app-updater__desc {
  margin: 0;
}

.app-updater__error {
  margin: 0;
  color: #d03050;
}
</style>
