import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: true,
})

// Blocos de código ganham cabeçalho com a linguagem e botão de copiar,
// conforme o design. O clique é tratado por delegação em ChatMessage.vue.
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]!
  const lang = md.utils.escapeHtml(token.info.trim() || 'texto')
  const code = md.utils.escapeHtml(token.content.replace(/\n$/, ''))
  return (
    `<div class="code-block">`
    + `<div class="code-block-header">`
    + `<span class="code-block-lang">${lang}</span>`
    + `<button type="button" class="code-copy" aria-label="Copiar código">⧉ copiar</button>`
    + `</div>`
    + `<pre><code>${code}</code></pre>`
    + `</div>`
  )
}

/** Renderiza Markdown do assistente e sanitiza o HTML resultante. */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(md.render(source))
}
