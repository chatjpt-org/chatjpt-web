<script setup lang="ts">
import { PanelLeftClose, Plus, Search, Settings, Trash2 } from '@lucide/vue'
import { useChatStore } from '~/stores/chat'
import { useSessionStore } from '~/stores/session'
import { useUiStore } from '~/stores/ui'

const chat = useChatStore()
const session = useSessionStore()
const ui = useUiStore()

function openConversation(id: string) {
  chat.selectConversation(id)
  ui.closeMobileSidebar()
}

function createConversation() {
  void chat.newConversation()
  ui.closeMobileSidebar()
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-head">
      <span class="sidebar-logo">chat<span class="sidebar-logo-accent">JPT</span></span>
      <div class="sidebar-head-actions">
        <button
          type="button"
          class="icon-button"
          aria-label="Colapsar barra lateral"
          title="Colapsar barra lateral"
          @click="ui.toggleSidebarCollapsed(); ui.closeMobileSidebar()"
        >
          <PanelLeftClose :size="15" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="new-chat-button"
          aria-label="Nova conversa"
          title="Nova conversa"
          @click="createConversation"
        >
          <Plus :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>

    <label class="sidebar-search">
      <Search :size="13" class="sidebar-search-icon" aria-hidden="true" />
      <input
        v-model="chat.searchQuery"
        type="search"
        class="sidebar-search-input"
        placeholder="Buscar conversas"
        aria-label="Buscar conversas"
      >
    </label>

    <nav class="conversation-list" aria-label="Conversas">
      <p v-if="chat.filteredConversations.length === 0" class="conversation-empty">
        {{ chat.searchQuery ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda. Crie a primeira!' }}
      </p>
      <div
        v-for="conversation in chat.filteredConversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ active: conversation.id === chat.activeConversationId }"
      >
        <button
          type="button"
          class="conversation-button"
          :aria-current="conversation.id === chat.activeConversationId ? 'true' : undefined"
          @click="openConversation(conversation.id)"
        >
          <span class="conversation-title">{{ conversation.title }}</span>
          <span class="conversation-preview">{{ chat.conversationPreview(conversation) }}</span>
        </button>
        <button
          type="button"
          class="conversation-delete icon-button"
          aria-label="Excluir conversa"
          title="Excluir conversa"
          @click.stop="chat.deleteConversation(conversation.id)"
        >
          <Trash2 :size="13" aria-hidden="true" />
        </button>
      </div>
    </nav>

    <button type="button" class="sidebar-user" @click="ui.settingsOpen = true">
      <span class="sidebar-avatar" aria-hidden="true">{{ session.initials }}</span>
      <span class="sidebar-user-info">
        <span class="sidebar-user-name">{{ session.user?.username }}</span>
        <span class="sidebar-user-status">servidor-casa · online</span>
      </span>
      <Settings :size="15" class="sidebar-user-gear" aria-hidden="true" />
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  flex: none;
  background: var(--bg-hard);
  display: flex;
  flex-direction: column;
  padding: 16px 14px;
  gap: 10px;
  border-right: 1px solid var(--bg-soft);
  overflow: hidden;
  transition: width 0.2s ease, opacity 0.15s ease, padding 0.2s ease;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 4px;
}

.sidebar-logo {
  font: 700 17px var(--font-mono);
  color: var(--fg);
}

.sidebar-logo-accent {
  color: var(--red);
}

.sidebar-head-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: var(--muted);
}

.icon-button:hover {
  background: var(--bg0);
  color: var(--fg);
}

.new-chat-button {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--red);
  display: grid;
  place-items: center;
  color: var(--bg-hard);
}

.new-chat-button:hover {
  background: var(--orange);
}

.sidebar-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg0);
  border-radius: 9px;
  padding: 9px 12px;
}

.sidebar-search-icon {
  color: var(--red);
  flex: none;
}

.sidebar-search-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  color: var(--fg);
  font-size: 12.5px;
}

.sidebar-search-input::placeholder {
  color: var(--faint);
}

.sidebar-search-input:focus {
  outline: none;
}

.conversation-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  margin-top: 4px;
}

.conversation-empty {
  margin: 8px 6px;
  font-size: 12px;
  color: var(--faint);
}

.conversation-item {
  position: relative;
  border-radius: 10px;
}

.conversation-item:hover {
  background: var(--bg0);
}

.conversation-item.active {
  background: var(--bg1);
}

.conversation-button {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  text-align: left;
  padding: 11px 34px 11px 13px;
  border-radius: 10px;
}

.conversation-title {
  color: var(--fg3);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.conversation-item.active .conversation-title {
  color: var(--fg);
}

.conversation-preview {
  color: var(--faint);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.conversation-item.active .conversation-preview {
  color: var(--muted);
}

.conversation-delete {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  opacity: 0;
}

.conversation-item:hover .conversation-delete,
.conversation-delete:focus-visible {
  opacity: 1;
}

.conversation-delete:hover {
  color: var(--red);
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg0);
  border-radius: 10px;
  padding: 10px 12px;
  text-align: left;
}

.sidebar-user:hover {
  background: var(--bg-soft);
}

.sidebar-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--bg2);
  display: grid;
  place-items: center;
  font: 600 10px var(--font-mono);
  color: var(--fg);
  flex: none;
}

.sidebar-user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-user-name {
  color: var(--fg);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-status {
  color: var(--muted);
  font-size: 10.5px;
}

.sidebar-user-gear {
  color: var(--muted);
  flex: none;
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .sidebar.sidebar-mobile-open {
    transform: translateX(0);
  }
}

@media (min-width: 901px) {
  .sidebar.collapsed {
    width: 0;
    padding: 0;
    border-right-color: transparent;
    opacity: 0;
    pointer-events: none;
  }
}
</style>
