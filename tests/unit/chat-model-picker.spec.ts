import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import ChatModelPicker from '~/components/chat/ChatModelPicker.vue'
import { useChatStore } from '~/stores/chat'

function mountPicker() {
  return mount(ChatModelPicker, {
    global: {
      stubs: { Teleport: true },
    },
  })
}

describe('seletor de modelos', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('lista apenas modelos retornados pela API e troca o modelo selecionado', async () => {
    const chat = useChatStore()
    chat.models = [
      { id: 'qwen2.5:1.5b-instruct', object: 'model', owned_by: 'chatjpt' },
      { id: 'qwen3:4b-instruct', object: 'model', owned_by: 'chatjpt' },
    ]
    chat.selectedModel = 'qwen2.5:1.5b-instruct'
    const wrapper = mountPicker()

    await wrapper.get('button[aria-label="Selecionar modelo"]').trigger('click')

    expect(wrapper.get('[role="dialog"]').text()).toContain('Ollama @ servidor-casa')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
    expect(wrapper.get('[data-model-id="qwen3:4b-instruct"]').text()).toContain('recomendado')

    await wrapper.get('[data-model-id="qwen3:4b-instruct"]').trigger('click')

    expect(chat.selectedModel).toBe('qwen3:4b-instruct')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('fecha com Escape', async () => {
    const chat = useChatStore()
    chat.models = [{ id: 'qwen2.5:1.5b-instruct', object: 'model', owned_by: 'chatjpt' }]
    const wrapper = mountPicker()

    await wrapper.get('button[aria-label="Selecionar modelo"]').trigger('click')
    await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
