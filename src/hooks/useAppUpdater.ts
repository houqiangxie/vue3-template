import { computed, onMounted, onUnmounted, ref } from 'vue';
import { IPC_CHANNELS, IPC_EVENTS, ipcInvoke, ipcOn, isElectron } from '@/utils/electron';
import type { UpdateStatusPayload } from '@/types/updater';

const defaultStatus = (): UpdateStatusPayload => ({ phase: 'idle' });

/** Subscribe to auto-update status and expose update actions. */
export function useAppUpdater() {
  const status = ref<UpdateStatusPayload>(defaultStatus());
  const visible = ref(false);
  let unsubscribe: (() => void) | undefined;

  const inElectron = computed(() => isElectron());
  const hasUpdate = computed(() => status.value.phase === 'available');
  const isDownloading = computed(() => status.value.phase === 'downloading');
  const isDownloaded = computed(() => status.value.phase === 'downloaded');
  const hasError = computed(() => status.value.phase === 'error');
  const progressPercent = computed(() => Math.round(status.value.progress?.percent ?? 0));

  function syncVisible(next: UpdateStatusPayload) {
    visible.value = ['available', 'downloading', 'downloaded', 'error'].includes(next.phase);
  }

  async function refreshStatus() {
    const next = await ipcInvoke(IPC_CHANNELS.UPDATE_GET_STATUS);
    if (next) {
      status.value = next;
      syncVisible(next);
    }
  }

  async function checkForUpdates() {
    const result = await ipcInvoke(IPC_CHANNELS.UPDATE_CHECK);
    if (!result?.ok && result?.reason) {
      status.value = { ...status.value, phase: 'error', error: result.reason };
      visible.value = true;
    }
    await refreshStatus();
    return result;
  }

  async function downloadUpdate() {
    const result = await ipcInvoke(IPC_CHANNELS.UPDATE_DOWNLOAD);
    await refreshStatus();
    return result;
  }

  async function quitAndInstall() {
    return ipcInvoke(IPC_CHANNELS.UPDATE_INSTALL);
  }

  function dismiss() {
    visible.value = false;
  }

  onMounted(async () => {
    if (!isElectron()) {
      return;
    }

    unsubscribe = ipcOn(IPC_EVENTS.UPDATE_STATUS, (payload) => {
      status.value = payload as UpdateStatusPayload;
      syncVisible(status.value);
    });

    await refreshStatus();
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  return {
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
  };
}
