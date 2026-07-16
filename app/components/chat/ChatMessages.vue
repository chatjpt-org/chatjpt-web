<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ChatStatus, Conversation } from '~/types/chat'

const props = defineProps<{
  conversation: Conversation
  status: ChatStatus
}>()

const scrollRef = ref<HTMLElement | null>(null)

function scrollToBottom() {
  const el = scrollRef.value
  if (el) el.scrollTop = el.scrollHeight
}

// Acompanha o streaming: rola para o fim a cada trecho novo.
watch(
  () => [props.conversation.id, props.conversation.messages.length, props.conversation.messages.at(-1)?.content],
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { immediate: true },
)
</script>

<template>
  <div ref="scrollRef" class="messages-scroll">
    <div class="messages-column">
      <div v-if="conversation.messages.length === 0" class="messages-empty">
        <p class="messages-empty-title">Conversa nova</p>
        <p class="messages-empty-hint">
          Envie uma mensagem para começar. O streaming da resposta é simulado nesta fase.
        </p>
      </div>

      <ChatMessage
        v-for="message in conversation.messages"
        :key="message.id"
        :message="message"
      />
    </div>
  </div>
</template>

<style scoped>
.messages-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  padding: 18px 48px 0;
}

.messages-column {
  width: 760px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 24px;
}

.messages-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 64px 16px;
  text-align: center;
}

.messages-empty-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--fg);
}

.messages-empty-hint {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
  max-width: 380px;
}

@media (max-width: 900px) {
  .messages-scroll {
    padding: 12px 16px 0;
  }
}
</style>
