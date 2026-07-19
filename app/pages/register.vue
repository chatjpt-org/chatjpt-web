<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useSessionStore } from '~/stores/session'

const session = useSessionStore()
const router = useRouter()
const form = reactive({ username: '', password: '', confirmation: '' })
const errorMessage = ref('')
const submitting = ref(false)

function validate(): boolean {
  errorMessage.value = ''
  if (!/^[a-z0-9_-]{3,64}$/.test(form.username)) {
    errorMessage.value = 'Use de 3 a 64 letras minusculas, numeros, hifens ou sublinhados no usuario.'
    return false
  }
  if (form.password.length < 12) {
    errorMessage.value = 'A senha deve ter ao menos 12 caracteres.'
    return false
  }
  if (form.password !== form.confirmation) {
    errorMessage.value = 'A confirmacao de senha nao confere.'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    await session.register(form.username, form.password)
    await router.push('/')
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Nao foi possivel criar sua conta.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="register-screen">
    <main class="register-card">
      <div class="register-head">
        <div class="register-logo" aria-hidden="true">J</div>
        <h1>Crie sua conta no chat<span>JPT</span></h1>
        <p>Contas novas usam somente os modelos liberados pelo administrador.</p>
      </div>

      <form class="register-form" novalidate @submit.prevent="submit">
        <label>
          Usuario
          <input v-model.trim="form.username" autocomplete="username" placeholder="seu-usuario">
        </label>
        <label>
          Senha
          <input v-model="form.password" type="password" autocomplete="new-password">
        </label>
        <label>
          Confirmar senha
          <input v-model="form.confirmation" type="password" autocomplete="new-password">
        </label>
        <p v-if="errorMessage" class="register-error" role="alert">{{ errorMessage }}</p>
        <button type="submit" :disabled="submitting">{{ submitting ? 'Criando...' : 'Criar conta' }}</button>
      </form>

      <p class="register-login">Ja possui uma conta? <NuxtLink to="/login">Entrar</NuxtLink></p>
    </main>
  </div>
</template>

<style scoped>
.register-screen { min-height: 100dvh; display: grid; place-items: center; padding: 24px; background: var(--bg-hard); }
.register-card { width: 420px; max-width: 100%; padding: 32px; border: 1px solid var(--bg1); border-radius: 10px; background: var(--bg0); box-shadow: 0 24px 64px rgba(0, 0, 0, .5); }
.register-head { text-align: center; }
.register-logo { width: 52px; height: 52px; display: grid; place-items: center; margin: 0 auto 14px; border-radius: 8px; background: var(--red); color: var(--bg-hard); font: 800 30px var(--font-mono); }
h1 { margin: 0; color: var(--fg); font-size: 19px; } h1 span { color: var(--red); }
.register-head p, .register-login { color: var(--fg4); font-size: 12px; line-height: 1.6; }
.register-form { display: flex; flex-direction: column; gap: 14px; margin-top: 22px; }
label { display: flex; flex-direction: column; gap: 7px; color: var(--fg2); font-size: 12px; font-weight: 600; }
input { border: 1px solid var(--bg2); border-radius: 8px; padding: 11px 12px; background: var(--bg-hard); color: var(--fg); }
input:focus { outline: none; border-color: var(--red); box-shadow: 0 0 0 3px rgba(251, 73, 52, .15); }
button { min-height: 44px; border-radius: 8px; background: var(--red); color: var(--bg-hard); font-weight: 700; } button:hover:not(:disabled) { background: var(--orange); } button:disabled { opacity: .6; cursor: wait; }
.register-error { margin: 0; color: var(--red); font-size: 12px; }
.register-login { margin: 20px 0 0; text-align: center; }
</style>