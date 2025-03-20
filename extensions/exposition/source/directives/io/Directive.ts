import type { Input } from '../../io'

export interface Directive {
  preflight: (context: Input) => void
}

export interface Constructor {
  validate: (value: unknown) => void

  new (value: any): Directive
}
