import type { Input } from '../../io'

export interface Directive {
  set: (input: Input, headers: Headers) => void
}

export interface AuthenticatedContext extends Input {
  identity?: unknown | null
}
