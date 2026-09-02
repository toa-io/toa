import type * as io from '../../io.js'
import type { Identity } from '../auth/types.js' // meh

export interface Extension {
  identity?: Identity
  octets?: string
}

export type Input = io.Input & Extension
