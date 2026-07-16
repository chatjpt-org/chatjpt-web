<script setup lang="ts">
import { LogOut, X } from '@lucide/vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { useChatStore } from '~/stores/chat'
import { useSessionStore } from '~/stores/session'
import { useUiStore } from '~/stores/ui'

const session = useSessionStore()
const chat = useChatStore()
const ui = useUiStore()
const router = useRouter()

function close() {
  ui.settingsOpen = false
}

async function signOut() {
  await session.signOut()
  chat.reset()
  close()
  await router.push('/login')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="settings-overlay" @click.self="close">
    <div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header class="settings-header">
        <h2 id="settings-title" class="settings-title">Conta</h2>
        <button type="button" class="settings-close" aria-label="Fechar configuracoes" title="Fechar" @click="close">
          <X :size="14" aria-hidden="true" />
        </button>
      </header>

      <div class="settings-body">
        <div class="settings-profile">
          <div class="settings-avatar" aria-hidden="true">{{ session.initials }}</div>
          <div>
            <p class="settings-field-label">Usuario autenticado</p>
            <p class="settings-username">{{ session.user?.username }}</p>
          </div>
        </div>
        <p class="settings-note">As contas sao administradas no servidor. Alteracoes de perfil nao estao disponiveis nesta versao.</p>
        <button type="button" class="settings-signout" @click="signOut">
          <LogOut :size="13" aria-hidden="true" /> Sair da sessao
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay { position: fixed; inset: 0; background: rgba(29, 32, 33, 0.75); display: grid; place-items: center; z-index: 50; padding: 16px; }
.settings-modal { width: 420px; max-width: 100%; background: var(--bg0); border: 1px solid var(--bg2); border-radius: 8px; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6); overflow: hidden; }
.settings-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--bg1); }
.settings-title { margin: 0; color: var(--fg); font-size: 15px; font-weight: 700; }
.settings-close { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; color: var(--muted); }
.settings-close:hover { background: var(--bg-soft); color: var(--fg); }
.settings-body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.settings-profile { display: flex; align-items: center; gap: 16px; }
.settings-avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--bg2); display: grid; place-items: center; font: 700 18px var(--font-mono); color: var(--fg); flex: none; }
.settings-field-label { margin: 0 0 4px; font-size: 12px; font-weight: 600; color: var(--fg2); }
.settings-username { margin: 0; color: var(--fg); font-size: 14px; }
.settings-note { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.6; }
.settings-signout { display: inline-flex; align-items: center; gap: 8px; color: var(--fg4); font-size: 12px; align-self: flex-start; }
.settings-signout:hover { color: var(--red); }
</style>
