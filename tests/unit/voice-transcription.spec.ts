import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ChatComposer from '~/components/chat/ChatComposer.vue'

class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = []
  continuous = false
  interimResults = false
  lang = ''
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onresult: ((event: { resultIndex: number, results: ArrayLike<{ isFinal: boolean, 0: { transcript: string } }> }) => void) | null = null

  constructor() {
    FakeSpeechRecognition.instances.push(this)
  }

  start() {}

  stop() {
    this.onend?.()
  }

  abort() {}
}

describe('ditado por voz', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    FakeSpeechRecognition.instances = []
    const browserWindow = window as Window & { SpeechRecognition?: typeof FakeSpeechRecognition, webkitSpeechRecognition?: typeof FakeSpeechRecognition }
    browserWindow.SpeechRecognition = FakeSpeechRecognition
    browserWindow.webkitSpeechRecognition = undefined
  })

  
  it('preenche o rascunho com a transcricao sem enviar a mensagem', async () => {
    const wrapper = mount(ChatComposer)
    await nextTick()

    await wrapper.get('.voice-button').trigger('click')
    const recognition = FakeSpeechRecognition.instances[0]
    recognition.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: 'explique o que e Go' } }],
    })
    await nextTick()

    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('explique o que e Go')
    expect(wrapper.find('button[aria-label="Parar ditado por voz"]').exists()).toBe(true)
    await wrapper.get('button[aria-label="Parar ditado por voz"]').trigger('click')
    wrapper.unmount()
  })
})
