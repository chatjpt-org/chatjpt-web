<script setup lang="ts">
import { onMounted } from 'vue'
import { useChatStore } from '~/stores/chat'
import { useUiStore } from '~/stores/ui'

const chat = useChatStore()
const ui = useUiStore()

onMounted(() => {
  void chat.loadModels()
  void chat.loadConversations()
})
</script>

<template>
  <div class="chat-layout">
    <ChatSidebarRail class="only-desktop" :class="{ 'rail-open': ui.sidebarCollapsed }" />
    <ChatSidebar
      :class="{
        'sidebar-mobile-open': ui.sidebarMobileOpen,
        collapsed: ui.sidebarCollapsed,
      }"
    />
    <div
      v-if="ui.sidebarMobileOpen"
      class="sidebar-overlay"
      aria-hidden="true"
      @click="ui.closeMobileSidebar()"
    />

    <main class="chat-main">
      <ChatHeader />

      <ChatMessages
        v-if="chat.activeConversation"
        :conversation="chat.activeConversation"
        :status="chat.status"
      />
      <div v-else class="chat-empty">
        <div class="chat-empty-logo" aria-hidden="true">J</div>
        <p class="chat-empty-title">Como posso ajudar hoje?</p>
        <p class="chat-empty-hint">Crie uma nova conversa ou escolha uma na barra lateral.</p>
      </div>

      <ChatComposer />
    </main>

    <ChatSettingsModal v-if="ui.settingsOpen" />
  </div>
</template>

<style scoped>
.chat-layout {
  height: 100%;
  display: flex;
  background: var(--bg0);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
}

.chat-empty-logo {
  width: 52px;
  height: 52px;
  background: var(--red);
  border-radius: 13px;
  display: grid;
  place-items: center;
  font: 800 28px var(--font-mono);
  color: var(--bg-hard);
  margin-bottom: 6px;
}

.chat-empty-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--fg);
}

.chat-empty-hint {
  margin: 0;
  font-size: 12.5px;
  color: var(--muted);
  text-align: center;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 900px) {
  .only-desktop {
    display: none;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(29, 32, 33, 0.65);
    z-index: 20;
  }
}
</style>
