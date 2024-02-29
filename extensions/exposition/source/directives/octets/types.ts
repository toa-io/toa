import type * as io from '../../io'

export interface Extension {
  octets?: string
}

export type Input = io.Input & Extension
