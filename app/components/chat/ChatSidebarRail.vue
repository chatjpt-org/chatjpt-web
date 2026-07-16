<script setup lang="ts">
import { PanelLeftOpen, Plus, Search, Settings } from '@lucide/vue'
import { useChatStore } from '~/stores/chat'
import { useSessionStore } from '~/stores/session'
import { useUiStore } from '~/stores/ui'

const chat = useChatStore()
const session = useSessionStore()
const ui = useUiStore()

function expandAndFocusSearch() {
  ui.sidebarCollapsed = false
}
</script>

<template>
  <aside class="rail" aria-label="Barra lateral colapsada">
    <div class="rail-logo" aria-hidden="true">J</div>
    <button
      type="button"
      class="rail-button"
      aria-label="Expandir barra lateral"
      title="Expandir barra lateral"
      @click="ui.toggleSidebarCollapsed()"
    >
      <PanelLeftOpen :size="15" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="rail-button rail-new-chat"
      aria-label="Nova conversa"
      title="Nova conversa"
      @click="void chat.newConversation()"
    >
      <Plus :size="17" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="rail-button"
      aria-label="Buscar conversas"
      title="Buscar conversas"
      @click="expandAndFocusSearch"
    >
      <Search :size="15" class="rail-search-icon" aria-hidden="true" />
    </button>
    <div class="rail-spacer" />
    <button
      type="button"
      class="rail-button"
      aria-label="Configurações"
      title="Configurações"
      @click="ui.settingsOpen = true"
    >
      <Settings :size="15" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="rail-avatar"
      aria-label="Configurações do perfil"
      title="Configurações do perfil"
      @click="ui.settingsOpen = true"
    >
      {{ session.initials }}
    </button>
  </aside>
</template>

<style scoped>
.rail {
  width: 0;
  flex: none;
  background: var(--bg-hard);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 10px;
  border-right: 1px solid transparent;
  overflow: hidden;
  opacity: 0;
  transition: width 0.2s ease, opacity 0.15s ease, padding 0.2s ease;
}

.rail.rail-open {
  width: 64px;
  border-right-color: var(--bg-soft);
  opacity: 1;
}

.rail-logo {
  width: 34px;
  height: 34px;
  background: var(--red);
  border-radius: 9px;
  display: grid;
  place-items: center;
  font: 800 16px var(--font-mono);
  color: var(--bg-hard);
}

.rail-button {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: var(--muted);
}

.rail-button:hover {
  background: var(--bg0);
  color: var(--fg);
}

.rail-new-chat {
  color: var(--red);
  border: 1px dashed var(--bg2);
}

.rail-new-chat:hover {
  border-color: var(--red);
  background: none;
  color: var(--red);
}

.rail-search-icon {
  color: var(--red);
}

.rail-spacer {
  flex: 1;
}

.rail-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--bg2);
  display: grid;
  place-items: center;
  font: 600 11px var(--font-mono);
  color: var(--fg);
}
</style>
