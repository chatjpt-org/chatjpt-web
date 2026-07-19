import { expect, test } from '@playwright/test'

test('cadastro cria apenas uma conta de membro', async ({ page }) => {
  let signedIn = false

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/v1/auth/session') {
      if (!signedIn) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'authentication is required' } }) })
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'member-1', username: 'novo-membro', role: 'member' }) })
    }
    if (path === '/api/v1/auth/register') {
      signedIn = true
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'member-1', username: 'novo-membro', role: 'member' }) })
    }
    if (path === '/api/v1/models') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'qwen2.5:1.5b-instruct', object: 'model', owned_by: 'chatjpt' }] }) })
    if (path === '/api/v1/conversations') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    throw new Error(`Rota inesperada: ${route.request().method()} ${path}`)
  })

  await page.goto('/register')
  await page.getByLabel('Usuario').fill('novo-membro')
  await page.getByLabel('Senha', { exact: true }).fill('senha-segura-123')
  await page.getByLabel('Confirmar senha').fill('senha-segura-123')
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.sidebar-user-status')).toHaveText('usuario comum')
  await page.locator('.sidebar-user').click()
  await expect(page.getByRole('button', { name: 'Administrar modelos e acessos' })).toHaveCount(0)
})

test('administrador gerencia modelos e concede acesso administrativo', async ({ page }) => {
  const requests: Array<{ path: string, body: unknown }> = []

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path === '/api/v1/auth/session') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'admin-1', username: 'admin', role: 'admin' }) })
    if (path === '/api/v1/models') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'qwen2.5:1.5b-instruct', object: 'model', owned_by: 'chatjpt' }] }) })
    if (path === '/api/v1/conversations') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    if (path === '/api/v1/admin/models' && request.method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [
        { id: 'qwen2.5:1.5b-instruct', object: 'model', owned_by: 'chatjpt', is_public: true },
        { id: 'qwen3:4b-instruct', object: 'model', owned_by: 'chatjpt', is_public: false },
        { id: 'gemma3:270m', object: 'model', owned_by: 'chatjpt', is_public: false },
      ] }) })
    }
    if (path === '/api/v1/admin/users' && request.method() === 'GET') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [
        { id: 'admin-1', username: 'admin', role: 'admin' },
        { id: 'member-1', username: 'membro', role: 'member' },
      ] }) })
    }
    if (path === '/api/v1/admin/models/gemma3%3A270m' && request.method() === 'PUT') {
      requests.push({ path, body: request.postDataJSON() })
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { message: 'model not found in the gateway catalog' } }) })
    }
    if (path === '/api/v1/admin/models/qwen3%3A4b-instruct' && request.method() === 'PUT') {
      requests.push({ path, body: request.postDataJSON() })
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'qwen3:4b-instruct', is_public: true }) })
    }
    if (path === '/api/v1/admin/users/membro/role' && request.method() === 'PATCH') {
      requests.push({ path, body: request.postDataJSON() })
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'member-1', username: 'membro', role: 'admin' }) })
    }
    if (path === '/api/v1/admin/users' && request.method() === 'POST') {
      requests.push({ path, body: request.postDataJSON() })
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'admin-2', username: 'novo-admin', role: 'admin' }) })
    }
    throw new Error(`Rota inesperada: ${request.method()} ${path}`)
  })

  await page.goto('/')
  await page.locator('.sidebar-user').click()
  await page.getByRole('button', { name: 'Administrar modelos e acessos' }).click()
  const dialog = page.getByRole('dialog', { name: 'Administracao' })
  await expect(dialog).toBeVisible()

  const rejectedModel = dialog.locator('.model-row').filter({ hasText: 'gemma3:270m' }).getByRole('checkbox')
  await rejectedModel.click()
  await expect(rejectedModel).not.toBeChecked()
  await dialog.locator('.model-row').filter({ hasText: 'qwen3:4b-instruct' }).getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Promover' }).click()
  await dialog.getByPlaceholder('novo-admin').fill('novo-admin')
  await dialog.getByPlaceholder('senha com 12 caracteres').fill('senha-segura-123')
  await dialog.getByRole('button', { name: 'Criar administrador' }).click()

  await expect.poll(() => requests).toEqual([
    { path: '/api/v1/admin/models/gemma3%3A270m', body: { is_public: true } },
    { path: '/api/v1/admin/models/qwen3%3A4b-instruct', body: { is_public: true } },
    { path: '/api/v1/admin/users/membro/role', body: { role: 'admin' } },
    { path: '/api/v1/admin/users', body: { username: 'novo-admin', password: 'senha-segura-123' } },
  ])
})