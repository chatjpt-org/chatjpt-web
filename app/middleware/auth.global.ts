import { useSessionStore } from '~/stores/session'

export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSessionStore()
  await session.restoreSession()

  if (!session.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (session.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
