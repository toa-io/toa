import { type Input } from '../../Directive'

export interface Directive {
  settle: (input: Input) => CacheHeader
}

export interface PostProcessInput extends Input {
  identity?: unknown | null
}

export type CacheControlFlag = 'private' | 'public' | 'no-cache'

export type CacheControlMap = Record<CacheControlFlag, boolean>

export interface CacheHeader {
  initiated: boolean
  key: string
  value: string
}
