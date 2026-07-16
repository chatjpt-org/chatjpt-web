import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { JChatApiError, getSession, signIn as apiSignIn, signOut as apiSignOut } from '~/services/jchat-api'
import type { SessionUser } from '~/types/chat'

function userFromApi(user: { id: string, username: string }): SessionUser {
  return { id: user.id, username: user.username }
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null)
  const loaded = ref(false)
  const errorMessage = ref<string | null>(null)
  let restorePromise: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)
  const initials = computed(() => user.value?.username.slice(0, 2).toUpperCase() ?? '')

  async function restoreSession() {
    if (loaded.value) return
    if (restorePromise) return restorePromise

    restorePromise = (async () => {
      try {
        user.value = userFromApi(await getSession())
      }
      catch (error) {
        user.value = null
        if (!(error instanceof JChatApiError && error.status === 401)) {
          errorMessage.value = 'Nao foi possivel verificar sua sessao. Tente novamente.'
        }
      }
      finally {
        loaded.value = true
        restorePromise = null
      }
    })()

    return restorePromise
  }

  async function signIn(username: string, password: string) {
    errorMessage.value = null
    user.value = userFromApi(await apiSignIn(username, password))
    loaded.value = true
  }

  async function signOut() {
    try {
      await apiSignOut()
    }
    finally {
      user.value = null
      loaded.value = true
      errorMessage.value = null
    }
  }

  function clear() {
    user.value = null
    errorMessage.value = null
  }

  return { user, loaded, errorMessage, isAuthenticated, initials, restoreSession, signIn, signOut, clear }
})
