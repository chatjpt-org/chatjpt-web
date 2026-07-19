import { onUnmounted, ref } from 'vue'

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  isFinal: boolean
  0: SpeechRecognitionAlternative
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResult>
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface BrowserSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function recognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined

  const browserWindow = window as SpeechRecognitionWindow
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
}

function errorMessage(error: string): string | null {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permita o uso do microfone para ditar a mensagem.'
    case 'audio-capture':
      return 'Nenhum microfone foi encontrado.'
    case 'network':
      return 'Nao foi possivel acessar o servico de transcricao do navegador.'
    case 'language-not-supported':
      return 'O navegador nao oferece transcricao em portugues.'
    case 'no-speech':
      return 'Nao foi detectada nenhuma fala.'
    case 'aborted':
      return null
    default:
      return 'Nao foi possivel transcrever sua fala. Tente novamente.'
  }
}

export function useVoiceTranscription() {
  const isSupported = ref(false)
  const isListening = ref(false)
  const wasStopped = ref(false)
  const transcriptionError = ref<string | null>(null)
  let recognition: BrowserSpeechRecognition | null = null

  function checkSupport() {
    isSupported.value = recognitionConstructor() !== undefined
  }

  function start(initialText: string, onTranscript: (text: string) => void) {
    const Constructor = recognitionConstructor()
    if (!Constructor || isListening.value) return

    transcriptionError.value = null
    wasStopped.value = false
    const prefix = initialText.trim()
    let finalTranscript = ''
    recognition = new Constructor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'pt-BR'
    recognition.onresult = (event) => {
      let interimTranscript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) finalTranscript += result[0].transcript
        else interimTranscript += result[0].transcript
      }

      const transcript = `${prefix} ${finalTranscript}${interimTranscript}`.trim()
      onTranscript(transcript)
    }
    recognition.onerror = (event) => {
      transcriptionError.value = errorMessage(event.error)
    }
    recognition.onend = () => {
      isListening.value = false
      recognition = null
      if (!transcriptionError.value) wasStopped.value = true
    }

    try {
      recognition.start()
      isListening.value = true
    }
    catch {
      transcriptionError.value = 'Nao foi possivel iniciar o microfone. Tente novamente.'
      recognition = null
    }
  }

  function stop() {
    if (!recognition || !isListening.value) return

    // Recognition.onend can take a moment to arrive. Update the UI immediately
    // so the user knows their click stopped the recording.
    isListening.value = false
    wasStopped.value = true
    recognition.stop()
  }

  onUnmounted(() => recognition?.abort())

  return { isSupported, isListening, wasStopped, transcriptionError, checkSupport, start, stop }
}
