import { type Parameter } from '../../RTD'

export interface Directive {
  authorize: (identity: Identity | null, parameters: Parameter[]) => boolean | Promise<boolean>
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
