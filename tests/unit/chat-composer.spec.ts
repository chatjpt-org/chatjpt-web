import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatComposer from '~/components/chat/ChatComposer.vue'
import { useChatStore } from '~/stores/chat'

function mountComposer() {
  return mount(ChatComposer)
}

describe('composer do chat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('envia com Enter e limpa o campo', async () => {
    const chat = useChatStore()
    const spy = vi.spyOn(chat, 'sendMessage').mockResolvedValue()
    const wrapper = mountComposer()
    const textarea = wrapper.get('textarea')

    await textarea.setValue('ola, mundo')
    await textarea.trigger('keydown', { key: 'Enter' })

    expect(spy).toHaveBeenCalledWith('ola, mundo')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
  })

  it('nao envia com Shift+Enter', async () => {
    const chat = useChatStore()
    const spy = vi.spyOn(chat, 'sendMessage').mockResolvedValue()
    const wrapper = mountComposer()
    const textarea = wrapper.get('textarea')

    await textarea.setValue('linha 1')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

    expect(spy).not.toHaveBeenCalled()
    expect((textarea.element as HTMLTextAreaElement).value).toBe('linha 1')
  })

  it('desabilita o envio quando o campo esta vazio', async () => {
    const wrapper = mountComposer()
    const send = wrapper.get('button[aria-label="Enviar mensagem"]')
    expect(send.attributes('disabled')).toBeDefined()

    await wrapper.get('textarea').setValue('algo')
    expect(send.attributes('disabled')).toBeUndefined()
  })

  it('mostra o botao de parar durante a geracao', () => {
    const chat = useChatStore()
    chat.status = 'streaming'
    const wrapper = mountComposer()

    expect(wrapper.find('button[aria-label="Parar geracao"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Enviar mensagem"]').exists()).toBe(false)
  })
})
