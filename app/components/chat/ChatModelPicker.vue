<script setup lang="ts">
import { Check, ChevronDown, X } from '@lucide/vue'
import { nextTick, ref } from 'vue'
import { useChatStore } from '~/stores/chat'

type ModelPresentation = {
  description: string
  label: string
}

const presentations: Record<string, ModelPresentation> = {
  'gemma3:270m': { label: 'ultrarrapido', description: 'Para respostas muito curtas e testes de latencia' },
  'qwen2.5:0.5b-instruct': { label: 'experimental', description: 'Modelo leve para comparacoes rapidas' },
  'gemma3:1b': { label: 'rapido', description: 'Alternativa leve com boa velocidade' },
  'qwen2.5:1.5b-instruct': { label: 'padrao', description: 'Equilibrio para conversas do dia a dia' },
  'deepseek-r1:1.5b': { label: 'raciocinio', description: 'Experimental; pode levar mais tempo para responder' },
  'llama3.2:3b': { label: 'experimental', description: 'Modelo geral leve para comparacoes' },
  'qwen3:4b-instruct': { label: 'recomendado', description: 'Melhor opcao avancada neste servidor' },
  'gemma3:4b': { label: 'multimodal', description: 'Alternativa avancada com suporte a imagem' },
  'qwen3.5:4b': { label: 'experimental', description: 'Opcao avancada em avaliacao' },
  'deepseek-r1:7b': { label: 'limite', description: 'Raciocinio pesado; resposta pode demorar' },
}

const chat = useChatStore()
const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const optionRefs = ref<HTMLButtonElement[]>([])

function presentationFor(modelID: string): ModelPresentation {
  return presentations[modelID] ?? { label: 'no servidor', description: 'Modelo local disponivel para a sua conta' }
}

function setOptionRef(element: Element | null) {
  if (element instanceof HTMLButtonElement) optionRefs.value.push(element)
}

function openPicker() {
  if (chat.isBusy || chat.models.length === 0) return
  optionRefs.value = []
  open.value = true
  void nextTick(() => {
    const selectedIndex = chat.models.findIndex(model => model.id === chat.selectedModel)
    optionRefs.value[selectedIndex >= 0 ? selectedIndex : 0]?.focus()
  })
}

function closePicker() {
  if (!open.value) return
  open.value = false
  void nextTick(() => triggerRef.value?.focus())
}

function selectModel(modelID: string) {
  chat.selectedModel = modelID
  closePicker()
}

function moveFocus(offset: number) {
  const currentIndex = chat.models.findIndex(model => model.id === chat.selectedModel)
  const nextIndex = (currentIndex + offset + chat.models.length) % chat.models.length
  optionRefs.value[nextIndex]?.focus()
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value) return

  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closePicker()
      break
    case 'ArrowDown':
      event.preventDefault()
      moveFocus(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveFocus(-1)
      break
    case 'Home':
      event.preventDefault()
      optionRefs.value[0]?.focus()
      break
    case 'End':
      event.preventDefault()
      optionRefs.value.at(-1)?.focus()
      break
  }
}

</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    class="model-picker-trigger"
    :disabled="chat.isBusy || chat.models.length === 0"
    :aria-expanded="open"
    aria-haspopup="dialog"
    aria-label="Selecionar modelo"
    title="Selecionar modelo"
    @click="openPicker"
  >
    <span class="status-dot" aria-hidden="true" />
    <span class="model-picker-trigger-name">{{ chat.models.length === 0 ? 'Nenhum modelo' : chat.selectedModel }}</span>
    <ChevronDown :size="13" aria-hidden="true" />
  </button>

  <Teleport to="body">
    <div v-if="open" class="model-picker-overlay" @click.self="closePicker">
      <section class="model-picker-dialog" role="dialog" aria-modal="true" aria-labelledby="model-picker-title" @keydown="onKeydown">
        <header class="model-picker-header">
          <div>
            <h2 id="model-picker-title">Selecionar modelo</h2>
            <p>Ollama @ servidor-casa</p>
          </div>
          <button type="button" class="model-picker-close" aria-label="Fechar seletor de modelos" title="Fechar" @click="closePicker">
            <X :size="15" aria-hidden="true" />
          </button>
        </header>

        <div class="model-picker-list" role="listbox" aria-label="Modelos disponiveis">
          <button
            v-for="model in chat.models"
            :key="model.id"
            :ref="setOptionRef"
            type="button"
            class="model-picker-option"
            :class="{ selected: model.id === chat.selectedModel }"
            :data-model-id="model.id"
            role="option"
            :aria-selected="model.id === chat.selectedModel"
            @click="selectModel(model.id)"
          >
            <span class="model-picker-check" aria-hidden="true">
              <Check v-if="model.id === chat.selectedModel" :size="15" />
            </span>
            <span class="model-picker-copy">
              <span class="model-picker-name">{{ model.id }}</span>
              <span class="model-picker-description">{{ presentationFor(model.id).description }}</span>
            </span>
            <span class="model-picker-label">{{ presentationFor(model.id).label }}</span>
          </button>
        </div>

        <footer class="model-picker-footer">
          <span>↑↓ navegar</span>
          <span>Enter selecionar</span>
          <span>Esc fechar</span>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.model-picker-trigger { display: inline-flex; align-items: center; gap: 7px; min-width: 0; max-width: 260px; padding: 5px 8px; border-radius: 7px; color: var(--fg3); font-size: 12px; }
.model-picker-trigger:hover:not(:disabled), .model-picker-trigger[aria-expanded="true"] { background: var(--bg-soft); color: var(--fg); }
.model-picker-trigger:focus-visible, .model-picker-option:focus-visible, .model-picker-close:focus-visible { outline: 1px solid var(--orange); outline-offset: 2px; }
.model-picker-trigger:disabled { cursor: default; opacity: 0.65; }
.model-picker-trigger-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); flex: none; }
.model-picker-overlay { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: 16px; background: rgba(29, 32, 33, 0.75); }
.model-picker-dialog { width: 520px; max-width: 100%; overflow: hidden; border: 1px solid var(--bg2); border-radius: 8px; background: var(--bg0); box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6); }
.model-picker-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 18px 20px 15px; border-bottom: 1px solid var(--bg1); }
.model-picker-header h2 { margin: 0; color: var(--fg); font-size: 15px; font-weight: 700; }
.model-picker-header p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }
.model-picker-close { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 7px; color: var(--muted); }
.model-picker-close:hover { background: var(--bg-soft); color: var(--fg); }
.model-picker-list { max-height: min(55vh, 520px); overflow-y: auto; padding: 8px; }
.model-picker-option { width: 100%; min-height: 58px; display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 7px; text-align: left; color: var(--fg); }
.model-picker-option:hover, .model-picker-option:focus-visible { background: var(--bg-soft); }
.model-picker-option.selected { background: var(--bg2); }
.model-picker-check { width: 22px; color: var(--orange); display: grid; place-items: center; }
.model-picker-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.model-picker-name { overflow: hidden; color: var(--fg); font: 600 13px var(--font-mono); text-overflow: ellipsis; white-space: nowrap; }
.model-picker-description { overflow: hidden; color: var(--muted); font-size: 11px; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
.model-picker-label { color: var(--orange); font-size: 10px; text-transform: lowercase; }
.model-picker-footer { display: flex; flex-wrap: wrap; gap: 12px; padding: 11px 20px; border-top: 1px solid var(--bg1); color: var(--faint); font-size: 10px; }
@media (max-width: 600px) { .model-picker-dialog { width: 100%; } .model-picker-option { grid-template-columns: 18px minmax(0, 1fr); } .model-picker-label { grid-column: 2; } .model-picker-description { white-space: normal; } }
</style>
