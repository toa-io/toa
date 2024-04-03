import { Language } from './Language'
import { Authority } from './Authority'
import type { Embedding } from './Embedding'

export const embeddings: Record<string, new () => Embedding> = {
  language: Language,
  authority: Authority
}

export type { Embedding }

export { Header } from './Header'
export { Parameter } from './Parameter'
