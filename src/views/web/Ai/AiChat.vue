<template>
  <div class="ai-chat">
    <n-card :bordered="false" class="ai-chat__card" content-style="padding: 0; height: 100%;">
      <div class="ai-chat__layout">
        <header class="ai-chat__header">
          <div>
            <h2 class="ai-chat__title">
              AI 助手
            </h2>
            <p class="ai-chat__desc">
              支持流式回复、停止生成与重新生成
            </p>
          </div>
        </header>

        <div
          ref="messageRef"
          class="ai-chat__messages"
          role="log"
          aria-label="聊天消息列表"
        >
          <div v-if="messageList.length === 0" class="ai-chat__empty">
            <n-empty description="开始提问吧，Enter 发送，Shift+Enter 换行" />
          </div>

          <div
            v-for="(message, index) in messageList"
            :key="message.id"
            class="ai-chat__item"
            :class="`ai-chat__item--${message.type}`"
          >
            <div class="ai-chat__row">
              <div class="ai-chat__avatar" :class="`ai-chat__avatar--${message.type}`">
                {{ message.type === 'send' ? '我' : 'AI' }}
              </div>
              <div class="ai-chat__bubble-wrap">
                <div
                  v-if="message.type === 'send'"
                  class="ai-chat__bubble ai-chat__bubble--user"
                >
                  {{ message.content }}
                </div>
                <div
                  v-else
                  class="ai-chat__bubble ai-chat__bubble--ai"
                  v-html="formatChatContent(message.content, !!message.isStreaming, message)"
                />
                <div v-if="message.type === 'receive' && !message.isStreaming" class="ai-chat__actions">
                  <n-button size="tiny" quaternary @click="copyMessage(message.content)">
                    复制
                  </n-button>
                  <n-button size="tiny" quaternary :disabled="generating" @click="reloadMessage(message, index)">
                    重新生成
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="ai-chat__footer">
          <div class="ai-chat__composer">
            <n-input
              v-model:value="input"
              type="textarea"
              :rows="3"
              :disabled="generating"
              placeholder="请输入你的问题…（Enter 发送，Shift+Enter 换行）"
              @keydown="handleKeyDown"
            />
            <div class="ai-chat__composer-actions">
              <n-button v-if="generating" type="error" @click="stopGeneration">
                停止
              </n-button>
              <n-button
                v-else
                type="primary"
                :disabled="!input.trim()"
                @click="sendMessage(false)"
              >
                发送
              </n-button>
            </div>
          </div>
        </footer>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useAiChat } from '@/hooks/useAiChat'

defineOptions({ name: 'Ai-AiChat' })

const {
  messageList,
  input,
  generating,
  messageRef,
  sendMessage,
  stopGeneration,
  reloadMessage,
  copyMessage,
  handleKeyDown,
  formatChatContent,
} = useAiChat()
</script>

<style scoped>
.ai-chat {
  height: calc(var(--app-vh, 100vh) - 140px);
  min-height: 520px;
}

.ai-chat__card {
  height: 100%;
}

.ai-chat__layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-chat__header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.ai-chat__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.ai-chat__desc {
  margin: 4px 0 0;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.ai-chat__messages {
  flex: 1;
  overflow: auto;
  padding: 16px 20px;
  background: var(--n-color-embedded);
}

.ai-chat__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 240px;
}

.ai-chat__item {
  margin-bottom: 18px;
}

.ai-chat__row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.ai-chat__item--send .ai-chat__row {
  flex-direction: row-reverse;
}

.ai-chat__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
}

.ai-chat__avatar--send {
  color: #fff;
  background: var(--n-primary-color, #1c90dc);
}

.ai-chat__avatar--receive {
  color: var(--n-text-color, #333);
  background: var(--n-color, #fff);
  border: 1px solid var(--n-border-color, #e0e0e6);
}

.ai-chat__bubble-wrap {
  max-width: min(72%, 720px);
}

.ai-chat__bubble {
  padding: 10px 12px;
  border-radius: 10px;
  line-height: 1.7;
  word-break: break-word;
  white-space: pre-wrap;
  font-size: 14px;
}

.ai-chat__bubble--user {
  color: #fff;
  background: var(--n-primary-color, #1c90dc);
  white-space: pre-wrap;
}

.ai-chat__bubble--ai {
  color: var(--n-text-color, #333);
  background: var(--n-color, #fff);
  border: 1px solid var(--n-border-color, #e0e0e6);
}

.ai-chat__actions {
  margin-top: 6px;
  display: flex;
  gap: 4px;
  opacity: 0.72;
}

.ai-chat__item:hover .ai-chat__actions {
  opacity: 1;
}

.ai-chat__footer {
  padding: 14px 20px 16px;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-color);
}

.ai-chat__composer {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.ai-chat__composer :deep(.n-input) {
  flex: 1;
}

.ai-chat__composer-actions {
  flex-shrink: 0;
}

.ai-chat__messages :deep(.ai-chat__think) {
  margin: 8px 0;
  padding: 8px 10px;
  border-left: 3px solid var(--n-success-color);
  background: color-mix(in srgb, var(--n-success-color) 8%, transparent);
  border-radius: 0 6px 6px 0;
}

.ai-chat__messages :deep(.ai-chat__think--pending) {
  border-left-color: var(--n-warning-color);
  background: color-mix(in srgb, var(--n-warning-color) 10%, transparent);
}

.ai-chat__messages :deep(.ai-chat__think-title) {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--n-text-color-2);
}

.ai-chat__messages :deep(.ai-chat__think-body) {
  font-size: 12px;
  line-height: 1.5;
  color: var(--n-text-color-3);
  white-space: pre-wrap;
}

.ai-chat__messages :deep(.ai-chat__cursor) {
  display: inline-block;
  margin-left: 2px;
  animation: ai-chat-blink 1s steps(1) infinite;
}

@keyframes ai-chat-blink {
  50% {
    opacity: 0;
  }
}
</style>
