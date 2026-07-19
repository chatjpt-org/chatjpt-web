import { createPinia, setActivePinia } from 'pinia'
import { nextTick, watch } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStore } from '~/stores/chat'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function sseResponse(events: string): Response {
  return new Response(events, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

function incrementalSSE(): {
  response: Response
  send: (event: string) => void
  close: () => void
} {
  let controller: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(streamController) {
      controller = streamController
    },
  })
  const encoder = new TextEncoder()

  return {
    response: new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }),
    send(event) {
      controller.enqueue(encoder.encode(event))
    },
    close() {
      controller.close()
    },
  }
}

describe('store de chat', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    setActivePinia(createPinia())
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  it('carrega conversas e as mensagens da primeira conversa', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '11111111-1111-4111-8111-111111111111', title: 'Primeira', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }] }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '22222222-2222-4222-8222-222222222222', role: 'user', content: 'Ola', created_at: '2026-01-01T00:00:01Z' }] }))

    const chat = useChatStore()
    await chat.loadConversations()

    expect(chat.activeConversation?.title).toBe('Primeira')
    expect(chat.activeConversation?.messages[0]?.content).toBe('Ola')
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      '/api/v1/conversations',
      '/api/v1/conversations/11111111-1111-4111-8111-111111111111/messages',
    ])
  })

  it('cria uma conversa no servidor e a torna ativa', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      id: '11111111-1111-4111-8111-111111111111', title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    }, 201))

    const chat = useChatStore()
    const conversation = await chat.newConversation()

    expect(conversation?.title).toBe('Nova conversa')
    expect(chat.activeConversationId).toBe(conversation?.id)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/v1/conversations')
  })

  it('envia uma mensagem, consome SSE e sincroniza mensagens persistidas', async () => {
    const conversationID = '11111111-1111-4111-8111-111111111111'
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Explique FIFO', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:01Z' }))
      .mockResolvedValueOnce(sseResponse('data: {"delta":"Resposta"}\n\ndata: {"delta":" completa"}\n\ndata: [DONE]\n\n'))
      .mockResolvedValueOnce(jsonResponse({ data: [
        { id: '22222222-2222-4222-8222-222222222222', role: 'user', content: 'Explique FIFO', created_at: '2026-01-01T00:00:01Z' },
        { id: '33333333-3333-4333-8333-333333333333', role: 'assistant', content: 'Resposta completa', created_at: '2026-01-01T00:00:02Z' },
      ] }))

    const chat = useChatStore()
    await chat.newConversation()
    await chat.sendMessage('Explique FIFO')

    expect(chat.activeConversation?.title).toBe('Explique FIFO')
    expect(chat.activeConversation?.messages.map(message => message.content)).toEqual(['Explique FIFO', 'Resposta completa'])
    expect(chat.status).toBe('idle')
		expect(JSON.parse(fetchMock.mock.calls[2]?.[1]?.body as string)).toMatchObject({ model: 'qwen2.5:1.5b-instruct', max_tokens: 1024 })
  })

  it('preserva e identifica uma resposta interrompida pelo backend', async () => {
    const conversationID = '11111111-1111-4111-8111-111111111111'
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Teste', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:01Z' }))
      .mockResolvedValueOnce(sseResponse('data: {"delta":"Resposta parcial"}\n\ndata: {"incomplete":true,"finish_reason":"length"}\n\ndata: [DONE]\n\n'))
      .mockResolvedValueOnce(jsonResponse({ data: [
        { id: '22222222-2222-4222-8222-222222222222', role: 'user', content: 'Teste', created_at: '2026-01-01T00:00:01Z' },
        { id: '33333333-3333-4333-8333-333333333333', role: 'assistant', content: 'Resposta parcial', incomplete: true, created_at: '2026-01-01T00:00:02Z' },
      ] }))

    const chat = useChatStore()
    await chat.newConversation()
    await chat.sendMessage('Teste')

    expect(chat.activeConversation?.messages.at(-1)).toMatchObject({
      content: 'Resposta parcial',
      incomplete: true,
      state: 'done',
    })
    expect(chat.status).toBe('idle')
  })
  it('atualiza a mensagem do assistente antes do fim do stream', async () => {
    const conversationID = '11111111-1111-4111-8111-111111111111'
    const stream = incrementalSSE()
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Teste de stream', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:01Z' }))
      .mockResolvedValueOnce(stream.response)
      .mockResolvedValueOnce(jsonResponse({ data: [
        { id: '22222222-2222-4222-8222-222222222222', role: 'user', content: 'Teste de stream', created_at: '2026-01-01T00:00:01Z' },
        { id: '33333333-3333-4333-8333-333333333333', role: 'assistant', content: 'Resposta parcial e final', created_at: '2026-01-01T00:00:02Z' },
      ] }))

    const chat = useChatStore()
    await chat.newConversation()
    let renderedContent = ''
    const stopWatchingReply = watch(
      () => chat.activeConversation?.messages.at(-1)?.content,
      content => { renderedContent = content ?? '' },
    )
    const sending = chat.sendMessage('Teste de stream')

    stream.send('data: {"delta":"Resposta parcial"}\n\n')
    await vi.waitFor(() => {
      expect(chat.activeConversation?.messages.at(-1)?.content).toBe('Resposta parcial')
      expect(chat.status).toBe('streaming')
    })
    await nextTick()
    expect(renderedContent).toBe('Resposta parcial')

    stream.send('data: {"delta":" e final"}\n\n')
    stream.send('data: [DONE]\n\n')
    stream.close()
    await sending
    stopWatchingReply()

    expect(chat.activeConversation?.messages.at(-1)?.content).toBe('Resposta parcial e final')
    expect(chat.status).toBe('idle')
  })

  it('carrega o catalogo de modelos e seleciona o primeiro disponivel', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ data: [
			{ id: 'qwen3:4b-instruct', object: 'model', owned_by: 'chatjpt' },
		] }))

		const chat = useChatStore()
		await chat.loadModels()

		expect(chat.models.map(model => model.id)).toEqual(['qwen3:4b-instruct'])
		expect(chat.selectedModel).toBe('qwen3:4b-instruct')
	})

  it('apresenta a falha enviada pelo gateway no stream', async () => {
    const conversationID = '11111111-1111-4111-8111-111111111111'
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Nova conversa', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: conversationID, title: 'Teste', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:01Z' }))
      .mockResolvedValueOnce(sseResponse('data: {"error":{"message":"the AI model is busy; try again shortly","code":"model_busy"}}\n\n'))

    const chat = useChatStore()
    await chat.newConversation()
    await chat.sendMessage('Teste')

    expect(chat.status).toBe('error')
    expect(chat.errorMessage).toContain('model is busy')
    expect(chat.activeConversation?.messages.at(-1)?.state).toBe('error')
  })

  it('remove uma conversa no servidor', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const chat = useChatStore()
    chat.conversations = [{ id: '11111111-1111-4111-8111-111111111111', title: 'Remover', messages: [], createdAt: 0, updatedAt: 0 }]
    chat.activeConversationId = '11111111-1111-4111-8111-111111111111'

    await chat.deleteConversation('11111111-1111-4111-8111-111111111111')

    expect(chat.conversations).toEqual([])
    expect(chat.activeConversationId).toBeNull()
  })
})
