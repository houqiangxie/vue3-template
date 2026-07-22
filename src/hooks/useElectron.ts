import { computed, onMounted, ref } from 'vue';
import {
  electronIpc,
  getElectronAPI,
  IPC_CHANNELS,
  IPC_EVENTS,
  ipcInvoke,
  ipcOn,
  ipcSend,
  isElectron,
} from '@/utils/electron';

/** Vue composable for Electron main/renderer IPC helpers. */
export function useElectron() {
  const inElectron = computed(() => isElectron());
  const platform = ref<string>('');
  const appVersion = ref<string>('');
  const runtimeVersions = computed(() => getElectronAPI()?.versions ?? null);

  onMounted(async () => {
    if (!isElectron()) {
      return;
    }
    platform.value = (await electronIpc.getPlatform()) ?? '';
    appVersion.value = (await electronIpc.getAppVersion()) ?? '';
  });

  return {
    inElectron,
    platform,
    appVersion,
    runtimeVersions,
    ipc: electronIpc,
    ipcInvoke,
    ipcSend,
    ipcOn,
    channels: IPC_CHANNELS,
    events: IPC_EVENTS,
  };
}
