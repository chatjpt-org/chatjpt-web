<script setup lang="ts">
import { X } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { createAdminUser, listAdminModels, listAdminUsers, updateModelVisibility, updateUserRole } from '~/services/jchat-api'
import type { ApiAdminModel, ApiAdminUser } from '~/services/jchat-api'
import { useSessionStore } from '~/stores/session'
import { useUiStore } from '~/stores/ui'

const session = useSessionStore()
const ui = useUiStore()
const models = ref<ApiAdminModel[]>([])
const users = ref<ApiAdminUser[]>([])
const loading = ref(true)
const errorMessage = ref('')
const creatingAdmin = ref(false)
const newAdmin = ref({ username: '', password: '' })

function close() {
  ui.adminOpen = false
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    ;[models.value, users.value] = await Promise.all([listAdminModels(), listAdminUsers()])
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel carregar a administracao.'
  }
  finally {
    loading.value = false
  }
}

async function setModelPublic(model: ApiAdminModel, isPublic: boolean) {
  try {
    const updated = await updateModelVisibility(model.id, isPublic)
    model.is_public = updated.is_public
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel atualizar o modelo.'
  }
}

async function promote(user: ApiAdminUser) {
  try {
    const updated = await updateUserRole(user.username, 'admin')
    user.role = updated.role
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel promover o usuario.'
  }
}

async function createAdmin() {
  if (!/^[a-z0-9_-]{3,64}$/.test(newAdmin.value.username) || newAdmin.value.password.length < 12) {
    errorMessage.value = 'Informe um usuario valido e uma senha com pelo menos 12 caracteres.'
    return
  }
  creatingAdmin.value = true
  try {
    const user = await createAdminUser(newAdmin.value.username, newAdmin.value.password)
    users.value.push(user)
    users.value.sort((left, right) => left.username.localeCompare(right.username))
    newAdmin.value = { username: '', password: '' }
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel criar o administrador.'
  }
  finally {
    creatingAdmin.value = false
  }
}

onMounted(() => {
  if (session.user?.role === 'admin') void load()
})
</script>

<template>
  <div class="admin-overlay" @click.self="close">
    <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <header>
        <div><h2 id="admin-title">Administracao</h2><p>Modelos publicos e acessos administrativos.</p></div>
        <button type="button" aria-label="Fechar administracao" @click="close"><X :size="16" aria-hidden="true" /></button>
      </header>
      <div class="admin-body">
        <p v-if="errorMessage" class="admin-error" role="alert">{{ errorMessage }}</p>
        <p v-if="loading">Carregando...</p>
        <template v-else>
          <section>
            <h3>Modelos para usuarios comuns</h3>
            <p class="admin-hint">Administradores mantem acesso a todos os modelos do catalogo.</p>
            <label v-for="model in models" :key="model.id" class="model-row">
              <span><strong>{{ model.id }}</strong><small>{{ model.is_public ? 'Publico para membros' : 'Travado para administradores' }}</small></span>
              <input type="checkbox" :checked="model.is_public" @change="setModelPublic(model, ($event.target as HTMLInputElement).checked)">
            </label>
          </section>
          <section>
            <h3>Criar administrador</h3>
            <form class="admin-create" @submit.prevent="createAdmin">
              <input v-model.trim="newAdmin.username" placeholder="novo-admin" autocomplete="username">
              <input v-model="newAdmin.password" type="password" placeholder="senha com 12 caracteres" autocomplete="new-password">
              <button type="submit" :disabled="creatingAdmin">{{ creatingAdmin ? 'Criando...' : 'Criar administrador' }}</button>
            </form>
          </section>
          <section>
            <h3>Usuarios</h3>
            <div v-for="user in users" :key="user.id" class="user-row">
              <span><strong>{{ user.username }}</strong><small>{{ user.role === 'admin' ? 'Administrador' : 'Usuario comum' }}</small></span>
              <button v-if="user.role === 'member'" type="button" @click="promote(user)">Promover</button>
            </div>
          </section>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-overlay { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 16px; background: rgba(29, 32, 33, .8); }
.admin-modal { width: 680px; max-width: 100%; max-height: calc(100dvh - 32px); overflow: auto; border: 1px solid var(--bg2); border-radius: 10px; background: var(--bg0); box-shadow: 0 24px 64px rgba(0,0,0,.6); }
header { display: flex; justify-content: space-between; gap: 16px; padding: 18px 20px; border-bottom: 1px solid var(--bg1); } h2, h3, p { margin-top: 0; } h2 { margin-bottom: 5px; font-size: 16px; } header p, .admin-hint, small { color: var(--muted); font-size: 11px; } header button { width: 36px; height: 36px; color: var(--muted); }
.admin-body { display: flex; flex-direction: column; gap: 24px; padding: 20px; } h3 { margin-bottom: 6px; font-size: 13px; } .admin-hint { margin-bottom: 10px; }
.model-row, .user-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 11px 0; border-top: 1px solid var(--bg1); } .model-row span, .user-row span { display: flex; min-width: 0; flex-direction: column; gap: 3px; } strong { color: var(--fg); font-size: 12px; overflow-wrap: anywhere; } input[type='checkbox'] { width: 18px; height: 18px; accent-color: var(--red); }
.admin-create { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; } input { min-width: 0; border: 1px solid var(--bg2); border-radius: 7px; padding: 10px; background: var(--bg-hard); color: var(--fg); } .admin-create button, .user-row button { min-height: 38px; border-radius: 7px; padding: 0 12px; background: var(--bg1); color: var(--fg); } .admin-create button:hover, .user-row button:hover { background: var(--bg2); } .admin-error { margin: 0; color: var(--red); font-size: 12px; }
@media (max-width: 600px) { .admin-overlay { padding: 12px; } .admin-body { padding: 16px; } .admin-create { grid-template-columns: 1fr; } .admin-create button, .user-row button { min-height: 44px; } }
</style>