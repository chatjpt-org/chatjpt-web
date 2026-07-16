import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Assets do design exportado (referência visual), não são código do app.
  ignores: ['ChatJPT_ Interface Local Ollama/**'],
})
