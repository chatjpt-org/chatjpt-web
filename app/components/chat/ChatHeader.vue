<script setup lang="ts">
import { Check, ChevronDown, Copy, Menu, Trash2 } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useChatStore } from '~/stores/chat'
import { useUiStore } from '~/stores/ui'

const chat = useChatStore()
const ui = useUiStore()

const menuOpen = ref(false)
const copied = ref(false)
const headerRef = ref<HTMLElement | null>(null)

function deleteActiveConversation() {
  if (chat.activeConversationId) {
    chat.deleteConversation(chat.activeConversationId)
  }
  menuOpen.value = false
}

async function copyConversationLink() {
  // Demonstração: apenas copia um link local simulado.
  const id = chat.activeConversationId ?? ''
  try {
    await navigator.clipboard.writeText(`local://chatjpt/c/${id}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
  catch {
    // Clipboard indisponível (ex.: permissões): ignora silenciosamente.
  }
}

function onDocumentClick(event: MouseEvent) {
  if (headerRef.value && !headerRef.value.contains(event.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <header ref="headerRef" class="chat-header">
    <div class="chat-header-left">
      <button
        type="button"
        class="menu-button"
        aria-label="Abrir barra lateral"
        title="Abrir barra lateral"
        @click="ui.openMobileSidebar()"
      >
        <Menu :size="17" aria-hidden="true" />
      </button>

      <div v-if="chat.activeConversation" class="title-wrap">
        <button
          type="button"
          class="title-button"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <span class="title-text">{{ chat.activeConversation.title }}</span>
          <ChevronDown :size="12" class="title-caret" aria-hidden="true" />
        </button>
        <div v-if="menuOpen" class="title-menu" role="menu">
          <button type="button" class="title-menu-item" role="menuitem" @click="deleteActiveConversation">
            <Trash2 :size="13" aria-hidden="true" /> Excluir conversa
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="chat.activeConversation"
      type="button"
      class="copy-link-button"
      @click="copyConversationLink"
    >
      <Check v-if="copied" :size="13" aria-hidden="true" />
      <Copy v-else :size="13" aria-hidden="true" />
      <span class="copy-link-label">{{ copied ? 'Copiado!' : 'Copiar link' }}</span>
    </button>
  </header>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  gap: 12px;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.menu-button {
  display: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  place-items: center;
  color: var(--muted);
}

.menu-button:hover {
  background: var(--bg-soft);
  color: var(--fg);
}

.title-wrap {
  position: relative;
  min-width: 0;
}

.title-button {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--fg);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 100%;
}

.title-button:hover {
  background: var(--bg-soft);
}

.title-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-caret {
  color: var(--muted);
  flex: none;
}

.title-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: var(--bg-hard);
  border: 1px solid var(--bg2);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  padding: 4px;
  z-index: 10;
  min-width: 180px;
}

.title-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--fg3);
  font-size: 12px;
  text-align: left;
}

.title-menu-item:hover {
  background: var(--bg-soft);
  color: var(--red);
}

.copy-link-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg1);
  border-radius: 8px;
  padding: 7px 14px;
  color: var(--fg);
  font-size: 12px;
  flex: none;
}

.copy-link-button:hover {
  background: var(--bg2);
}

@media (max-width: 900px) {
  .menu-button {
    display: grid;
  }
}
@media (max-width: 600px) {
  .chat-header {
    padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 8px max(12px, env(safe-area-inset-left));
    gap: 4px;
  }

  .menu-button,
  .copy-link-button {
    width: 44px;
    height: 44px;
  }

  .copy-link-button {
    position: relative;
    display: grid;
    place-items: center;
    gap: 0;
    background: transparent;
    padding: 0;
  }

  .copy-link-label {
    display: none;
  }

  .copy-link-button::before {
    position: absolute;
    inset: 4px;
    content: '';
    background: var(--bg1);
    border-radius: 8px;
  }

  .copy-link-button:hover {
    background: transparent;
  }

  .copy-link-button:hover::before {
    background: var(--bg2);
  }

  .copy-link-button svg {
    position: relative;
    z-index: 1;
  }
}
</style>
