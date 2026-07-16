export default defineNuxtConfig({
  // SPA estática: o app será servido como arquivos estáticos, sem runtime Node.
  ssr: false,

  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  css: [
    '@fontsource/instrument-sans/400.css',
    '@fontsource/instrument-sans/500.css',
    '@fontsource/instrument-sans/600.css',
    '@fontsource/jetbrains-mono/400.css',
    '@fontsource/jetbrains-mono/500.css',
    '@fontsource/jetbrains-mono/600.css',
    '@fontsource/jetbrains-mono/700.css',
    '@fontsource/jetbrains-mono/800.css',
    '~/assets/css/main.css',
  ],

  app: {
    head: {
      title: 'chatJPT',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'color-scheme', content: 'dark' },
      ],
    },
  },

  typescript: {
    strict: true,
  },

  compatibilityDate: '2025-07-15',
})
