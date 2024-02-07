import { Language } from './Language'
import { Header } from './Header'

import type { Embedding } from './Embedding'

export const embeddings: Record<string, new () => Embedding> = {
  language: Language
}

export { Header }
export type { Embedding }
