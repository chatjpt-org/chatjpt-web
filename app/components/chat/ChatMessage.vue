<script setup lang="ts">
import { AlertCircle, Check, Copy, ThumbsDown, ThumbsUp } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { Message } from '~/types/chat'
import { useChatStore } from '~/stores/chat'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{
  message: Message
}>()

const chat = useChatStore()
const copied = ref(false)

const html = computed(() => renderMarkdown(props.message.content))

const metaText = computed(() => {
  if (props.message.state === 'streaming') return `${props.message.model} · gerando…`
  return props.message.model ?? ''
})

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
  catch {
    // Clipboard indisponível: ignora.
  }
}

// Delegação para os botões de copiar dos blocos de código gerados pelo Markdown.
async function onContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('.code-copy')
  if (!button) return
  const code = button.closest('.code-block')?.querySelector('pre')?.textContent ?? ''
  try {
    await navigator.clipboard.writeText(code)
    button.textContent = '✓ copiado!'
    setTimeout(() => (button.textContent = '⧉ copiar'), 1500)
  }
  catch {
    // Clipboard indisponível: ignora.
  }
}
</script>

<template>
  <div v-if="message.role === 'user'" class="message-user">
    <div class="message-user-bubble">{{ message.content }}</div>
  </div>

  <div v-else class="message-assistant" :class="{ 'message-error': message.state === 'error' }">
    <div class="message-meta">{{ metaText }}</div>

    <div v-if="message.incomplete" class="message-incomplete-box" role="status">
      <AlertCircle :size="15" class="message-incomplete-icon" aria-hidden="true" />
      <p>A resposta foi interrompida antes de ser concluida.</p>
    </div>

    <div v-if="message.state === 'error'" class="message-error-box" role="alert">
      <AlertCircle :size="15" class="message-error-icon" aria-hidden="true" />
      <div>
        <p class="message-error-text">{{ message.content }}</p>
      </div>
    </div>

    <template v-else>
      <div v-if="message.state === 'streaming'" class="markdown-body streaming-body">
        {{ message.content }}<span class="streaming-cursor" aria-hidden="true" />
      </div>

      <template v-else>
        <div class="markdown-body" @click="onContentClick">
        <!-- eslint-disable-next-line vue/no-v-html -- HTML sanitizado com DOMPurify em renderMarkdown -->
          <span v-html="html" />
        </div>

        <div v-if="message.state === 'done'" class="message-actions">
        <button
          type="button"
          class="message-action"
          :aria-label="copied ? 'Copiado' : 'Copiar resposta'"
          :title="copied ? 'Copiado' : 'Copiar resposta'"
          @click="copyMessage"
        >
          <Check v-if="copied" :size="14" aria-hidden="true" />
          <Copy v-else :size="14" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="message-action"
          :class="{ active: message.feedback === 'up' }"
          aria-label="Resposta útil"
          title="Resposta útil"
          @click="chat.toggleFeedback(message, 'up')"
        >
          <ThumbsUp :size="14" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="message-action"
          :class="{ active: message.feedback === 'down' }"
          aria-label="Resposta ruim"
          title="Resposta ruim"
          @click="chat.toggleFeedback(message, 'down')"
        >
          <ThumbsDown :size="14" aria-hidden="true" />
        </button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.message-user {
  display: flex;
  justify-content: flex-end;
}

.message-user-bubble {
  max-width: 480px;
  background: var(--red);
  color: var(--bg-hard);
  font-size: 13.5px;
  line-height: 1.6;
  font-weight: 600;
  padding: 11px 17px;
  border-radius: 14px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.message-assistant {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-meta {
  color: var(--gray);
  font-size: 11px;
}

.message-actions {
  display: flex;
  gap: 14px;
}

.message-action {
  color: var(--faint);
  display: grid;
  place-items: center;
}

.message-action:hover:not(:disabled) {
  color: var(--fg);
}

.message-action.active {
  color: var(--yellow);
}

.message-action:disabled {
  opacity: 0.4;
  cursor: default;
}

.message-incomplete-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: rgba(250, 189, 47, 0.08);
  border: 1px solid rgba(250, 189, 47, 0.35);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--fg3);
  font-size: 12px;
  line-height: 1.5;
}

.message-incomplete-box p {
  margin: 0;
}

.message-incomplete-icon {
  color: var(--yellow);
  flex: none;
  margin-top: 1px;
}

.message-error-box {
  display: flex;
  gap: 10px;
  background: rgba(251, 73, 52, 0.08);
  border: 1px solid rgba(251, 73, 52, 0.35);
  border-radius: 10px;
  padding: 12px 14px;
}

.message-error-icon {
  color: var(--red);
  flex: none;
  margin-top: 2px;
}

.message-error-text {
  margin: 0;
  color: var(--fg);
  font-size: 13px;
  line-height: 1.6;
}

.streaming-body {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

</style>
