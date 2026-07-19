<script setup lang="ts">
import { Mic, Paperclip, SendHorizontal, Square } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import ChatModelPicker from '~/components/chat/ChatModelPicker.vue'
import { useVoiceTranscription } from '~/composables/useVoiceTranscription'
import { useChatStore } from '~/stores/chat'

const chat = useChatStore()
const draft = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const {
  checkSupport,
  isListening,
  isSupported,
  start,
  stop,
  transcriptionError,
  wasStopped,
} = useVoiceTranscription()
const canSend = computed(() => draft.value.trim().length > 0 && !chat.isBusy)

onMounted(checkSupport)

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

function toggleVoiceTranscription() {
  if (isListening.value) {
    stop()
    return
  }

  start(draft.value, (transcript) => {
    draft.value = transcript
    resizeTextarea()
  })
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
        <div class="composer-toolbar-left">
          <button type="button" class="composer-attach" aria-label="Anexar arquivo (indisponivel)" title="Anexar arquivo (indisponivel)" disabled>
            <Paperclip :size="14" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="voice-button"
            :class="{ 'voice-button--listening': isListening }"
            :disabled="chat.isBusy || !isSupported"
            :aria-pressed="isListening"
            :aria-label="isSupported ? (isListening ? 'Parar ditado por voz' : 'Iniciar ditado por voz') : 'Ditado por voz indisponivel neste navegador'"
            :title="isSupported ? (isListening ? 'Parar ditado por voz' : 'Iniciar ditado por voz') : 'Use um navegador compativel com reconhecimento de voz'"
            @click="toggleVoiceTranscription"
          >
            <Square v-if="isListening" :size="12" fill="currentColor" aria-hidden="true" />
            <Mic v-else :size="15" aria-hidden="true" />
          </button>
        </div>

        <div class="composer-toolbar-right">
          <ChatModelPicker />
          <button v-if="chat.isBusy" type="button" class="send-button" aria-label="Parar geracao" title="Parar geracao" @click="chat.stopStreaming()">
            <Square :size="13" fill="currentColor" aria-hidden="true" />
          </button>
          <button v-else type="button" class="send-button" :disabled="!canSend" aria-label="Enviar mensagem" title="Enviar mensagem" @click="send">
            <SendHorizontal :size="15" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    <p v-if="!isSupported" class="composer-voice-error" role="status">Ditado por voz indisponivel neste navegador.</p>
    <p v-else-if="transcriptionError" class="composer-voice-error" role="status">{{ transcriptionError }}</p>
    <p v-else-if="isListening" class="composer-voice-status" role="status">Ouvindo. Clique no quadrado para encerrar o ditado.</p>
    <p v-else-if="wasStopped" class="composer-voice-status" role="status">Ditado encerrado.</p>
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
.composer-toolbar-left { display: flex; align-items: center; gap: 8px; }
.composer-attach { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; color: var(--muted); }
.composer-attach:disabled { opacity: 0.5; cursor: default; }
.voice-button { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; color: var(--muted); }
.voice-button:hover:not(:disabled) { color: var(--fg); background: var(--bg1); }
.voice-button:disabled { opacity: 0.5; cursor: default; }
.voice-button--listening, .voice-button--listening:hover:not(:disabled) { color: var(--bg-hard); background: var(--red); animation: voice-pulse 1.2s ease-in-out infinite; }
.composer-toolbar-right { display: flex; align-items: center; gap: 10px; }
.send-button { width: 32px; height: 32px; border-radius: 8px; background: var(--red); display: grid; place-items: center; color: var(--bg-hard); }
.send-button:hover:not(:disabled) { background: var(--orange); }
.send-button:disabled { opacity: 0.45; cursor: default; }
.composer-voice-error { margin: 0; font-size: 11px; color: var(--orange); text-align: center; }
.composer-voice-status { margin: 0; font-size: 11px; color: var(--muted); text-align: center; }
.composer-disclaimer { margin: 0; font-size: 10.5px; color: var(--faint); text-align: center; }
@keyframes voice-pulse { 50% { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.18); } }
@media (max-width: 900px) { .composer-area { padding: 10px 12px 12px; } }
@media (max-width: 600px) {
  .composer-area {
    padding: 10px max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  }

  .composer-card {
    padding: 12px;
    gap: 8px;
  }

  .composer-input {
    font-size: 16px;
  }

  .composer-toolbar-left,
  .composer-toolbar-right {
    gap: 2px;
  }

  .composer-attach,
  .voice-button,
  .send-button {
    width: 44px;
    height: 44px;
  }

}
</style>
