import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createConversation as createConversationRequest,
  deleteConversation as deleteConversationRequest,
  listConversations,
  listModels as listModelsRequest,
  listMessages,
  renameConversation,
  streamMessage,
} from '~/services/jchat-api'
import type { ApiModel } from '~/services/jchat-api'
import type { ChatStatus, Conversation, Message } from '~/types/chat'

const DEFAULT_MODEL = 'qwen2.5:1.5b-instruct'
const MAX_TOKENS = 1024
const TITLE_MAX_LENGTH = 40

function timestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? Date.now() : parsed
}

function titleFromContent(content: string): string {
  const clean = content.replace(/\s+/g, ' ').trim()
  if (clean.length <= TITLE_MAX_LENGTH) return clean
  return `${clean.slice(0, TITLE_MAX_LENGTH - 1)}...`
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const status = ref<ChatStatus>('idle')
  const errorMessage = ref<string | null>(null)
  const searchQuery = ref('')
  const loadingConversations = ref(false)
  const models = ref<ApiModel[]>([])
  const selectedModel = ref(DEFAULT_MODEL)
  const loadingModels = ref(false)
  let abortController: AbortController | null = null

  const activeConversation = computed(
    () => conversations.value.find(conversation => conversation.id === activeConversationId.value) ?? null,
  )
  const isBusy = computed(() => status.value === 'loading' || status.value === 'streaming')
  const filteredConversations = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return conversations.value
    return conversations.value.filter(conversation =>
      conversation.title.toLowerCase().includes(query)
      || conversationPreview(conversation).toLowerCase().includes(query))
  })

  function conversationPreview(conversation: Conversation): string {
    const last = conversation.messages.at(-1)
    if (!last) return 'Conversa vazia'
    return last.content.replace(/\s+/g, ' ').trim().slice(0, 80)
  }

  function conversationByID(id: string): Conversation | undefined {
    return conversations.value.find(conversation => conversation.id === id)
  }

  async function loadConversations() {
    loadingConversations.value = true
    errorMessage.value = null
    try {
      const existingMessages = new Map(conversations.value.map(conversation => [conversation.id, conversation.messages]))
      conversations.value = (await listConversations()).map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        createdAt: timestamp(conversation.created_at),
        updatedAt: timestamp(conversation.updated_at),
        messages: existingMessages.get(conversation.id) ?? [],
      }))

      if (activeConversationId.value && conversationByID(activeConversationId.value)) return
      const firstConversation = conversations.value[0]
      if (firstConversation) await selectConversation(firstConversation.id)
      else activeConversationId.value = null
    }
    catch (error) {
      errorMessage.value = messageForError(error)
    }
    finally {
      loadingConversations.value = false
    }
  }

  async function loadMessages(conversationID: string) {
    const conversation = conversationByID(conversationID)
    if (!conversation) return

    const messages = await listMessages(conversationID)
    conversation.messages = messages.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: timestamp(message.created_at),
      state: 'done',
      model: message.role === 'assistant' ? (message.model ?? DEFAULT_MODEL) : undefined,
      incomplete: message.incomplete ?? false,
    }))
  }

  async function loadModels() {
    loadingModels.value = true
    try {
      const availableModels = await listModelsRequest()
      models.value = availableModels
      if (availableModels.some(model => model.id === selectedModel.value)) return
      selectedModel.value = availableModels[0]?.id ?? DEFAULT_MODEL
    }
    catch (error) {
      models.value = []
      errorMessage.value = messageForError(error)
    }
    finally {
      loadingModels.value = false
    }
  }

  async function newConversation(): Promise<Conversation | undefined> {
    if (isBusy.value) return undefined
    errorMessage.value = null
    try {
      const created = await createConversationRequest('Nova conversa')
      const conversation: Conversation = {
        id: created.id,
        title: created.title,
        messages: [],
        createdAt: timestamp(created.created_at),
        updatedAt: timestamp(created.updated_at),
      }
      conversations.value.unshift(conversation)
      activeConversationId.value = conversation.id
      return conversation
    }
    catch (error) {
      errorMessage.value = messageForError(error)
      return undefined
    }
  }

  async function selectConversation(id: string) {
    if (isBusy.value) stopStreaming()
    activeConversationId.value = id
    errorMessage.value = null
    try {
      await loadMessages(id)
    }
    catch (error) {
      errorMessage.value = messageForError(error)
    }
  }

  async function deleteConversation(id: string) {
    if (isBusy.value) return
    try {
      await deleteConversationRequest(id)
      conversations.value = conversations.value.filter(conversation => conversation.id !== id)
      if (activeConversationId.value === id) {
        activeConversationId.value = null
        const nextConversation = conversations.value[0]
        if (nextConversation) await selectConversation(nextConversation.id)
      }
    }
    catch (error) {
      errorMessage.value = messageForError(error)
    }
  }

  async function sendMessage(text: string) {
    const content = text.trim()
    if (!content || isBusy.value) return

    const conversation = activeConversation.value ?? await newConversation()
    if (!conversation) return

    const isFirstMessage = conversation.messages.length === 0
    if (isFirstMessage) await renameFirstConversation(conversation, content)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: Date.now(),
      state: 'done',
    }
    conversation.messages.push(userMessage, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      state: 'streaming',
      model: selectedModel.value,
      incomplete: false,
    })
    const reply = conversation.messages.at(-1)!
    conversation.updatedAt = Date.now()

    status.value = 'loading'
    errorMessage.value = null
    abortController = new AbortController()

    try {
      await streamMessage(conversation.id, content, {
        model: selectedModel.value,
        maxTokens: MAX_TOKENS,
        signal: abortController.signal,
        onDelta(delta) {
          reply.content += delta
          status.value = 'streaming'
        },
        onIncomplete() {
          reply.incomplete = true
        },
      })
      await loadMessages(conversation.id)
      status.value = 'idle'
    }
    catch (error) {
      if (isAbortError(error)) {
        // O servidor pode concluir a resposta depois do cancelamento do navegador.
        await refreshAfterAbort(conversation.id)
        status.value = 'idle'
      }
      else if (reply.content) {
        reply.incomplete = true
        reply.state = 'done'
        errorMessage.value = 'A resposta foi interrompida, mas o conteudo recebido foi preservado.'
        status.value = 'idle'
      }
      else {
        reply.state = 'error'
        reply.content = messageForError(error)
        errorMessage.value = reply.content
        status.value = 'error'
      }
    }
    finally {
      abortController = null
    }
  }

  async function renameFirstConversation(conversation: Conversation, content: string) {
    try {
      const renamed = await renameConversation(conversation.id, titleFromContent(content))
      conversation.title = renamed.title
      conversation.updatedAt = timestamp(renamed.updated_at)
    }
    catch {
      // A mensagem continua utilizavel mesmo se a conveniencia de renomear falhar.
    }
  }

  async function refreshAfterAbort(conversationID: string) {
    try {
      await loadMessages(conversationID)
    }
    catch {
      // Mantemos o texto parcial apresentado enquanto a API termina a requisicao.
    }
  }

  function stopStreaming() {
    abortController?.abort()
  }

  function toggleFeedback(message: Message, feedback: 'up' | 'down') {
    message.feedback = message.feedback === feedback ? undefined : feedback
  }

  function reset() {
    abortController?.abort()
    conversations.value = []
    activeConversationId.value = null
    status.value = 'idle'
    errorMessage.value = null
    searchQuery.value = ''
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    filteredConversations,
    conversationPreview,
    status,
    isBusy,
    errorMessage,
    searchQuery,
    loadingConversations,
    models,
    selectedModel,
    loadingModels,
    loadModels,
    loadConversations,
    newConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
    toggleFeedback,
    reset,
  }
})

function messageForError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Nao foi possivel concluir a operacao. Tente novamente.'
}
