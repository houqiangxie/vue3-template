<template>
  <div v-if="inElectron" class="electron-notification-demo">
    <n-button @click="handleOpenWindow">测试通知</n-button>
    <n-card
      title="Electron 通知 Demo"
      size="small"
      :bordered="true"
      class="electron-notification-demo__card"
    >
      <n-space vertical :size="12">
        <n-text depth="3">
          点击「隐藏到托盘并测试通知」，窗口会先缩到托盘，{{ delaySeconds }} 秒后自动发通知并闪烁；点击系统通知后下方会收到回调。
        </n-text>

        <n-space>
          <n-button type="primary" :loading="pending" @click="hideAndNotify">
            隐藏到托盘并测试通知
          </n-button>
          <n-button @click="stopTrayFlash">
            停止闪烁
          </n-button>
        </n-space>

        <n-alert v-if="pending" type="info" :show-icon="false">
          已隐藏到托盘，{{ countdown }} 秒后发送通知…
        </n-alert>

        <n-alert v-if="lastClick" type="success" :show-icon="false">
          通知点击回调：id = {{ lastClick.id ?? '—' }}，时间 = {{ lastClick.time }}
        </n-alert>

        <div v-if="clickLogs.length" class="electron-notification-demo__logs">
          <n-text depth="3">回调记录</n-text>
          <ul>
            <li v-for="(log, index) in clickLogs" :key="index">
              [{{ log.time }}] 点击了通知 {{ log.id }}
            </li>
          </ul>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { useElectronNotification } from '@/hooks/useElectronNotification';
import { electronIpc, isElectron } from '@/utils/electron';
import type { NotificationClickPayload } from '@/hooks/useElectronNotification';

interface ClickLog {
  id: string;
  time: string;
}

const delaySeconds = 3;
const delayMs = delaySeconds * 1000;

const inElectron = isElectron();
const message = useMessage();
const { showNotification, onNotificationClick } = useElectronNotification();

const notifySeq = ref(0);
const pending = ref(false);
const countdown = ref(delaySeconds);
const lastClick = ref<{ id?: string; time: string } | null>(null);
const clickLogs = ref<ClickLog[]>([]);

let offClick: (() => void) | undefined;
let countdownTimer: ReturnType<typeof setInterval> | undefined;

function formatTime(date = new Date()) {
  return date.toLocaleTimeString();
}

function handleNotificationClick(payload: NotificationClickPayload) {
  pending.value = false;
  clearCountdown();

  const time = formatTime();
  lastClick.value = { id: payload.id, time };
  clickLogs.value.unshift({
    id: payload.id ?? '(无 id)',
    time,
  });
  if (clickLogs.value.length > 8) {
    clickLogs.value.length = 8;
  }
  message.success(`收到通知点击回调：${payload.id ?? '(无 id)'}`);
}

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = undefined;
  }
}

function startCountdown() {
  clearCountdown();
  countdown.value = delaySeconds;
  countdownTimer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearCountdown();
      pending.value = false;
    }
  }, 1000);
}

async function hideAndNotify() {
  notifySeq.value += 1;
  const id = `demo-msg-${notifySeq.value}`;

  const result = await showNotification({
    id,
    title: '测试消息',
    body: `第 ${notifySeq.value} 条消息，托盘应开始闪烁`,
    flashTray: true,
    flashTaskbar: true,
    delay: delayMs,
  });

  if (!result) {
    message.error('预约通知失败');
    return;
  }

  pending.value = true;
  // startCountdown();
  message.warning(`主窗口即将隐藏，${delaySeconds} 秒后自动发送通知`);

  // 等 IPC 完成后再隐藏，通知由主进程定时触发
  setTimeout(() => {
    void electronIpc.window.close();
  }, 300);
}

function stopTrayFlash() {
  pending.value = false;
  clearCountdown();
  void electronIpc.tray.flashStop();
  message.info('已停止托盘闪烁');
}

function handleOpenWindow() {
  window.open('http://localhost:81/');
  // void electronIpc.window.open({
  //   url: 'https://www.baidu.com',
  //   width: 800,
  //   height: 600,
  // });
}

onMounted(() => {
  // offClick = onNotificationClick(handleNotificationClick);
});

onUnmounted(() => {
  // offClick?.();
  // clearCountdown();
});
</script>

<style scoped lang="scss">
.electron-notification-demo {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  width: 360px;
  max-width: calc(100vw - 32px);
}

.electron-notification-demo__card {
  box-shadow: 0 6px 24px rgb(0 0 0 / 12%);
}

.electron-notification-demo__logs {
  ul {
    margin: 6px 0 0;
    padding-left: 18px;
    font-size: 12px;
    color: var(--n-text-color-3);
  }

  li + li {
    margin-top: 4px;
  }
}
</style>
