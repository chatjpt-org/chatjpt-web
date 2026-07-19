export type MessageRole = 'user' | 'assistant'

/** Estado global do fluxo de resposta do chat. */
export type ChatStatus = 'idle' | 'loading' | 'streaming' | 'error'

/** Estado individual de uma mensagem do assistente. */
export type MessageState = 'streaming' | 'done' | 'error'

export interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  state: MessageState
  /** Modelo que gerou a mensagem (apenas para o assistente). */
  model?: string
  incomplete?: boolean
  feedback?: 'up' | 'down'
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface SessionUser {
  id: string
  username: string
}
