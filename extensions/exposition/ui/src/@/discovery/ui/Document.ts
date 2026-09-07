import snarkdown from 'snarkdown'
import type { ClassValue } from 'svelte/elements'

export interface Props {
  source: string
  title: string
  class?: ClassValue
}

/** Snarkdown emits no `<p>`; typeset styles almost nothing else for body text. */
const BLOCK = /^<(?:h[1-6]|ul|ol|pre|blockquote|hr|footer|table|p)\b/i

/**
 * The page names the document, so the file's own heading is not shown again.
 * Fences stay whole: splitting on blank lines would break a multipart example.
 */
export function html(source: string): string {
  return chunks(source.replace(/^# [^\n]+\n+/, ''))
    .map((block) => {
      if (block.startsWith('<')) return block

      const rendered = snarkdown(block)

      if (rendered === '' || BLOCK.test(rendered)) return rendered

      return `<p>${rendered}</p>`
    })
    .join('\n')
}

function chunks(source: string): string[] {
  const out: string[] = []
  const fence = /```[\s\S]*?```/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = fence.exec(source)) !== null) {
    out.push(...source.slice(last, match.index).split(/\n{2,}/))
    out.push(match[0])
    last = match.index + match[0].length
  }

  out.push(...source.slice(last).split(/\n{2,}/))

  return out.map((chunk) => chunk.trim()).filter((chunk) => chunk !== '')
}

