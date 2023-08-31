import { type Parameter } from '../../RTD'
import type * as directive from '../../Directive'

export interface Directive {
  authorize: (identity: Identity | null, input: Input, parameters: Parameter[]) =>
  boolean | Promise<boolean>
}

export interface Identity {
  readonly id: string
  scheme: string
  roles?: string[]
  stale: boolean
}

export interface Extension {
  identity: Identity | null
}

export type Input = directive.Input & Extension
