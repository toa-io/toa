import type * as directive from '../../Directive'

export interface Directive {
  apply: (storage: string, input: Input) => directive.Output | Promise<directive.Output>
}

export interface Extension {
  octets?: string
}

export type Input = directive.Input & Extension
