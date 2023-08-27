import { type Parameter } from '../../RTD'

export interface Directive {
  authorize: (identity: Identity | null, parameters: Parameter[]) => boolean | Promise<boolean>
}

export interface Identity {
  readonly id: string
  upgrade?: string
}
