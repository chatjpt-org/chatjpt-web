<script setup lang="ts">
import { Paperclip, SendHorizontal, Square } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useChatStore } from '~/stores/chat'

const chat = useChatStore()
const draft = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const canSend = computed(() => draft.value.trim().length > 0 && !chat.isBusy)

function send() {
  if (!canSend.value) return
  const text = draft.value
  draft.value = ''
  resizeTextarea()
  void chat.sendMessage(text)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    send()
  }
}

function resizeTextarea() {
  const element = textareaRef.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${Math.min(element.scrollHeight, 200)}px`
}
</script>

<template>
  <div class="composer-area">
    <div class="composer-card">
      <textarea
        ref="textareaRef"
        v-model="draft"
        class="composer-input"
        rows="1"
        placeholder="Escreva uma mensagem..."
        aria-label="Escreva uma mensagem"
        @keydown="onKeydown"
        @input="resizeTextarea"
      />
      <div class="composer-toolbar">
        <button type="button" class="composer-attach" aria-label="Anexar arquivo (indisponivel)" title="Anexar arquivo (indisponivel)" disabled>
          <Paperclip :size="14" aria-hidden="true" />
        </button>

        <div class="composer-toolbar-right">
          <span class="model-label" title="Modelo configurado no servidor">
            <span class="status-dot" aria-hidden="true" />
            qwen2.5:1.5b-instruct
          </span>
          <button v-if="chat.isBusy" type="button" class="send-button" aria-label="Parar geracao" title="Parar geracao" @click="chat.stopStreaming()">
            <Square :size="13" fill="currentColor" aria-hidden="true" />
          </button>
          <button v-else type="button" class="send-button" :disabled="!canSend" aria-label="Enviar mensagem" title="Enviar mensagem" @click="send">
            <SendHorizontal :size="15" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    <p class="composer-disclaimer">chatJPT pode cometer erros. Suas conversas ficam no seu servidor.</p>
  </div>
</template>

<style scoped>
.composer-area { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 48px 16px; }
.composer-card { width: 760px; max-width: 100%; background: var(--bg-hard); border: 1px solid var(--bg1); border-radius: 8px; padding: 16px 16px 12px; box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4); display: flex; flex-direction: column; gap: 14px; }
.composer-card:focus-within { border-color: var(--bg2); }
.composer-input { background: none; border: none; resize: none; color: var(--fg); font-size: 13.5px; line-height: 1.6; padding: 0 4px; max-height: 200px; }
.composer-input::placeholder { color: var(--faint); }
.composer-input:focus { outline: none; }
.composer-toolbar { display: flex; align-items: center; justify-content: space-between; }
.composer-attach { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; color: var(--muted); }
.composer-attach:disabled { opacity: 0.5; cursor: default; }
.composer-toolbar-right { display: flex; align-items: center; gap: 10px; }
.model-label { display: flex; align-items: center; gap: 7px; padding: 5px 10px; color: var(--fg3); font-size: 12px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.send-button { width: 32px; height: 32px; border-radius: 8px; background: var(--red); display: grid; place-items: center; color: var(--bg-hard); }
.send-button:hover:not(:disabled) { background: var(--orange); }
.send-button:disabled { opacity: 0.45; cursor: default; }
.composer-disclaimer { margin: 0; font-size: 10.5px; color: var(--faint); text-align: center; }
@media (max-width: 900px) { .composer-area { padding: 10px 12px 12px; } .model-label { display: none; } }
</style>
