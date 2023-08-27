import { type Parameter } from '../../RTD'

export interface Directive {
  authorize: (identity: Identity | null, parameters: Parameter[]) => boolean
}

export interface Identity {
  id: string
}
