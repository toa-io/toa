import { Language } from './Language'
import type { Embedding } from './Embedding'

export const embeddings: Record<string, new () => Embedding> = {
  language: Language
}

export type { Embedding }

export { Header } from './Header'
export { Parameter } from './Parameter'
