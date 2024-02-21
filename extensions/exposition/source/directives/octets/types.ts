import type { Parameter } from '../../RTD'
import type * as io from '../../io'

export interface Directive {
  readonly targeted: boolean

  apply: (storage: string, input: Input, parameters: Parameter[]) => io.Output | Promise<io.Output>
}

export interface Extension {
  octets?: string
}

export type Input = io.Input & Extension
