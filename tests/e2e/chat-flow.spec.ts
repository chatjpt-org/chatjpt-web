import { expect, test } from '@playwright/test'

test('fluxo integrado: login, conversa e resposta SSE', async ({ page }) => {
  let signedIn = false
  const conversationID = '11111111-1111-4111-8111-111111111111'
  let messages: Array<{ id: string, role: string, content: string, created_at: string }> = []

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname

    if (path === '/api/v1/auth/session') {
      if (!signedIn) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'authentication is required' } }) })
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'user-1', username: 'arthur' }) })
    }
    if (path === '/api/v1/auth/login') {
      signedIn = true
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'user-1', username: 'arthur' }) })
    }
    if (path === '/api/v1/models') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'qwen2.5:1.5b-instruct', object: 'model', owned_by: 'chatjpt' }] }) })
    }
    if (path === '/api/v1/conversations' && request.method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }
    if (path === '/api/v1/conversations' && request.method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: conversationID, title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }) })
    }
    if (path === `/api/v1/conversations/${conversationID}` && request.method() === 'PATCH') {
      const title = (request.postDataJSON() as { title: string }).title
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: conversationID, title, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:01Z' }) })
    }
    if (path === `/api/v1/conversations/${conversationID}/messages` && request.method() === 'POST') {
      const content = (request.postDataJSON() as { content: string }).content
      messages = [
        { id: '22222222-2222-4222-8222-222222222222', role: 'user', content, created_at: '2026-01-01T00:00:01Z' },
        { id: '33333333-3333-4333-8333-333333333333', role: 'assistant', content: 'RAG usa documentos relevantes antes de responder.', created_at: '2026-01-01T00:00:02Z' },
      ]
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"delta":"RAG usa documentos relevantes antes de responder."}\n\ndata: [DONE]\n\n' })
    }
    if (path === `/api/v1/conversations/${conversationID}/messages` && request.method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: messages }) })
    }
    throw new Error(`Rota inesperada: ${request.method()} ${path}`)
  })

  await page.goto('/login')
  await page.locator('#login-username').fill('arthur')
  await page.locator('#login-password').fill('senha-segura')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page).toHaveURL(/\/$/)
  await page.locator('.sidebar').getByRole('button', { name: 'Nova conversa' }).click()
  await expect(page.getByText('Conversa nova')).toBeVisible()

  const composer = page.getByPlaceholder('Escreva uma mensagem...')
  await composer.fill('Me explique o que e RAG')
  await composer.press('Enter')

  await expect(page.getByText('Me explique o que e RAG').first()).toBeVisible()
  await expect(page.getByRole('main').getByText('RAG usa documentos relevantes antes de responder.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copiar resposta' })).toBeVisible()
})
