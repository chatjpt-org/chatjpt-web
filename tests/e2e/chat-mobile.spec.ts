import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

async function mockChatAPI(page: import('@playwright/test').Page) {
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
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [
        { id: 'qwen2.5:1.5b-instruct', object: 'model', owned_by: 'chatjpt' },
        { id: 'qwen3:4b-instruct', object: 'model', owned_by: 'chatjpt' },
      ] }) })
    }
    if (path === '/api/v1/conversations' && request.method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }
    if (path === '/api/v1/conversations' && request.method() === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: conversationID, title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }) })
    }
    if (path === `/api/v1/conversations/${conversationID}` && request.method() === 'PATCH') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: conversationID, title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:01Z' }) })
    }
    if (path === `/api/v1/conversations/${conversationID}/messages` && request.method() === 'POST') {
      const content = (request.postDataJSON() as { content: string }).content
      messages = [
        { id: '22222222-2222-4222-8222-222222222222', role: 'user', content, created_at: '2026-01-01T00:00:01Z' },
        { id: '33333333-3333-4333-8333-333333333333', role: 'assistant', content: 'Resposta para celular.', created_at: '2026-01-01T00:00:02Z' },
      ]
      return route.fulfill({ contentType: 'text/event-stream', body: 'data: {"delta":"Resposta para celular."}\n\ndata: [DONE]\n\n' })
    }
    if (path === `/api/v1/conversations/${conversationID}/messages` && request.method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: messages }) })
    }
    throw new Error(`Rota inesperada: ${request.method()} ${path}`)
  })
}

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.locator('#login-username').fill('arthur')
  await page.locator('#login-password').fill('senha-segura')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/\/$/)
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

test('fluxo móvel: navegação, modelo e conversa sem estouro horizontal', async ({ page }) => {
  await mockChatAPI(page)
  await signIn(page)
  await expectNoHorizontalOverflow(page)

  await page.getByRole('button', { name: 'Abrir barra lateral' }).click()
  await expect(page.locator('.sidebar')).toHaveClass(/sidebar-mobile-open/)
  await page.locator('.sidebar-overlay').click({ position: { x: 360, y: 80 } })
  await expect(page.locator('.sidebar')).not.toHaveClass(/sidebar-mobile-open/)

  await page.getByRole('button', { name: 'Abrir barra lateral' }).click()
  await page.locator('.sidebar').getByRole('button', { name: 'Nova conversa' }).click()
  await expect(page.locator('.sidebar')).not.toHaveClass(/sidebar-mobile-open/)
  await expect(page.getByText('Conversa nova')).toBeVisible()

  await page.getByRole('button', { name: 'Selecionar modelo' }).click()
  const dialog = page.getByRole('dialog', { name: 'Selecionar modelo' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveJSProperty('scrollHeight', await dialog.evaluate(element => element.clientHeight))
  await page.locator('[data-model-id="qwen3:4b-instruct"]').click()

  await page.getByPlaceholder('Escreva uma mensagem...').fill('Teste no celular')
  await page.getByRole('button', { name: 'Enviar mensagem' }).click()
  await expect(page.getByRole('main').getByText('Resposta para celular.')).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.setViewportSize({ width: 768, height: 1024 })
  await page.getByRole('button', { name: 'Abrir barra lateral' }).click()
  await expect(page.locator('.sidebar')).toHaveClass(/sidebar-mobile-open/)
  await page.keyboard.press('Escape')
  await expect(page.locator('.sidebar')).not.toHaveClass(/sidebar-mobile-open/)
  await expectNoHorizontalOverflow(page)
  await page.setViewportSize({ width: 320, height: 568 })
  await expectNoHorizontalOverflow(page)
  const touchTargetSizes = await page.locator('.composer-toolbar button').evaluateAll(buttons => buttons.map(button => {
    const bounds = button.getBoundingClientRect()
    return { className: button.className, width: bounds.width, height: bounds.height }
  }))
  expect(touchTargetSizes.every(target => target.width >= 44 && target.height >= 44)).toBe(true)
})
