export interface ApiUser {
  id: string
  username: string
}

export interface ApiConversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ApiMessage {
	id: string
	role: 'user' | 'assistant'
	content: string
	model?: string
	created_at: string
}

export interface ApiModel {
	id: string
	object: string
	owned_by: string
}

interface ApiErrorResponse {
  error?: {
    message?: string
    code?: string
  }
}

interface ApiDataResponse<T> {
  data: T
}

interface StreamEvent {
  delta?: string
  finish_reason?: string
  error?: {
    message?: string
    code?: string
  }
}

export class JChatApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'JChatApiError'
  }
}

async function readError(response: Response): Promise<JChatApiError> {
  let payload: ApiErrorResponse | undefined
  try {
    payload = await response.json() as ApiErrorResponse
  }
  catch {
    // A resposta pode ter vindo de um proxy ou de uma pagina de erro sem JSON.
  }

  return new JChatApiError(
    payload?.error?.message ?? `A API respondeu com status ${response.status}.`,
    response.status,
    payload?.error?.code,
  )
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) throw await readError(response)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function signIn(username: string, password: string): Promise<ApiUser> {
  return request<ApiUser>('/v1/auth/login', jsonRequest('POST', { username, password }))
}

export function signOut(): Promise<void> {
  return request<undefined>('/v1/auth/logout', { method: 'POST' })
}

export function getSession(): Promise<ApiUser> {
	return request<ApiUser>('/v1/auth/session')
}

export async function listModels(): Promise<ApiModel[]> {
	const response = await request<ApiDataResponse<ApiModel[]>>('/v1/models')
	return response.data
}

export async function listConversations(): Promise<ApiConversation[]> {
  const response = await request<ApiDataResponse<ApiConversation[]>>('/v1/conversations')
  return response.data
}

export function createConversation(title: string): Promise<ApiConversation> {
  return request<ApiConversation>('/v1/conversations', jsonRequest('POST', { title }))
}

export function renameConversation(id: string, title: string): Promise<ApiConversation> {
  return request<ApiConversation>(`/v1/conversations/${id}`, jsonRequest('PATCH', { title }))
}

export function deleteConversation(id: string): Promise<void> {
  return request<undefined>(`/v1/conversations/${id}`, { method: 'DELETE' })
}

export async function listMessages(conversationID: string): Promise<ApiMessage[]> {
  const response = await request<ApiDataResponse<ApiMessage[]>>(`/v1/conversations/${conversationID}/messages`)
  return response.data
}

function consumeEvent(rawEvent: string, onDelta: (delta: string) => void): boolean {
  const data = rawEvent
    .split(/\r?\n/)
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trimStart())
    .join('\n')

  if (!data) return false
  if (data === '[DONE]') return true

  let event: StreamEvent
  try {
    event = JSON.parse(data) as StreamEvent
  }
  catch {
    throw new JChatApiError('A API enviou um evento de streaming invalido.', 502, 'invalid_stream')
  }

  if (event.error) {
    throw new JChatApiError(
      event.error.message ?? 'Nao foi possivel gerar a resposta.',
      502,
      event.error.code,
    )
  }
  if (event.delta) onDelta(event.delta)
  return false
}

export async function streamMessage(
  conversationID: string,
  content: string,
  options: {
	model: string
	maxTokens: number
    signal: AbortSignal
    onDelta: (delta: string) => void
  },
): Promise<void> {
  const response = await fetch(`/api/v1/conversations/${conversationID}/messages`, {
    method: 'POST',
    credentials: 'include',
    signal: options.signal,
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, model: options.model, max_tokens: options.maxTokens }),
  })

  if (!response.ok) throw await readError(response)
  if (!response.body) {
    throw new JChatApiError('A API nao iniciou o streaming da resposta.', 502, 'invalid_stream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() ?? ''
      for (const event of events) {
        if (consumeEvent(event, options.onDelta)) return
      }

      if (done) break
    }

    if (buffer.trim() && consumeEvent(buffer, options.onDelta)) return
    throw new JChatApiError('O streaming foi encerrado sem confirmacao final.', 502, 'incomplete_stream')
  }
  finally {
    reader.releaseLock()
  }
}
