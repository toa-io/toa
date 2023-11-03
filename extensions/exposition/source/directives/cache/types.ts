import { type Output, type Input } from '../../Directive'

export interface Directive {
  preProcess?: (input: Input) => Output
  postProcess?: (input: Input, headers: Headers) => void
}

export interface PostProcessInput extends Input {
  identity?: unknown | null
}

export type CacheControlFlag = 'private' | 'public' | 'no-cache'

export type CacheControlMap = Record<CacheControlFlag, boolean>
