<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import { reactive, ref } from 'vue'
import { useSessionStore } from '~/stores/session'

const session = useSessionStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const errors = reactive({ username: '', password: '' })
const showPassword = ref(false)
const submitting = ref(false)
const submitError = ref('')

function validate(): boolean {
  errors.username = ''
  errors.password = ''
  submitError.value = ''

  if (!form.username.trim()) errors.username = 'Informe seu usuario.'
  if (!form.password) errors.password = 'Informe sua senha.'

  return !errors.username && !errors.password
}

async function submit() {
  if (!validate()) return

  submitting.value = true
  try {
    await session.signIn(form.username.trim(), form.password)
    await router.push('/')
  }
  catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Nao foi possivel entrar.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-screen">
    <main class="login-card">
      <div class="login-head">
        <div class="login-logo" aria-hidden="true">J</div>
        <h1 class="login-title">
          Entrar no chat<span class="login-title-accent">JPT</span>
        </h1>
        <p class="login-subtitle">Entre com a conta criada pelo administrador.</p>
      </div>

      <form class="login-form" novalidate @submit.prevent="submit">
        <div class="login-field">
          <label class="login-label" for="login-username">Usuario</label>
          <input
            id="login-username"
            v-model="form.username"
            class="login-input"
            type="text"
            autocomplete="username"
            placeholder="arthur"
            :aria-invalid="Boolean(errors.username)"
          >
          <p v-if="errors.username" class="login-error" role="alert">{{ errors.username }}</p>
        </div>

        <div class="login-field">
          <label class="login-label" for="login-password">Senha</label>
          <div class="login-password">
            <input
              id="login-password"
              v-model="form.password"
              class="login-input login-input-password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :aria-invalid="Boolean(errors.password)"
            >
            <button
              type="button"
              class="login-toggle-password"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="15" aria-hidden="true" />
              <Eye v-else :size="15" aria-hidden="true" />
            </button>
          </div>
          <p v-if="errors.password" class="login-error" role="alert">{{ errors.password }}</p>
        </div>

        <p v-if="submitError" class="login-error" role="alert">{{ submitError }}</p>
        <button type="submit" class="login-submit" :disabled="submitting">
          {{ submitting ? 'Entrando...' : 'Continuar' }}
        </button>
      </form>

      <footer class="login-footer">
        <span class="status-dot" aria-hidden="true" /> autenticacao local · servidor-casa
      </footer>
    </main>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg-hard);
}

.login-card {
  width: 400px;
  max-width: 100%;
  background: var(--bg0);
  border: 1px solid var(--bg1);
  border-radius: 8px;
  padding: 36px 36px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}

.login-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.login-logo {
  width: 64px;
  height: 64px;
  background: var(--red);
  border-radius: 8px;
  display: grid;
  place-items: center;
  font: 800 38px var(--font-mono);
  color: var(--bg-hard);
  box-shadow: 0 8px 24px rgba(251, 73, 52, 0.35);
}

.login-title {
  margin: 0;
  font: 600 19px var(--font-sans);
  color: var(--fg);
}

.login-title-accent {
  color: var(--red);
  font-family: var(--font-mono);
}

.login-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  font-family: var(--font-sans);
  color: var(--fg4);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.login-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--fg2);
}

.login-input {
  width: 100%;
  border: 1px solid var(--bg2);
  border-radius: 8px;
  padding: 11px 14px;
  color: var(--fg);
  font-size: 13.5px;
  background: var(--bg-hard);
}

.login-input::placeholder {
  color: var(--faint);
}

.login-input:focus {
  outline: none;
  border-color: var(--red);
  box-shadow: 0 0 0 3px rgba(251, 73, 52, 0.15);
}

.login-input[aria-invalid='true'] {
  border-color: var(--red);
}

.login-password {
  position: relative;
}

.login-input-password {
  padding-right: 42px;
}

.login-toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--faint);
  display: grid;
  place-items: center;
}

.login-toggle-password:hover {
  color: var(--fg);
}

.login-error {
  margin: 0;
  font-size: 12px;
  color: var(--red);
}

.login-submit {
  background: var(--red);
  border-radius: 8px;
  padding: 12px;
  color: var(--bg-hard);
  font-size: 14px;
  font-weight: 700;
  margin-top: 2px;
}

.login-submit:hover:not(:disabled) {
  background: var(--orange);
}

.login-submit:disabled {
  opacity: 0.6;
  cursor: wait;
}

.login-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  border-top: 1px solid var(--bg1);
  padding-top: 16px;
  color: var(--faint);
  font-size: 11px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
}
</style>
