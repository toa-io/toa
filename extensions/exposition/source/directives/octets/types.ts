import type * as io from '../../io.ts'
import type { Identity } from '../auth/types.ts' // meh

export interface Extension {
  identity?: Identity
  octets?: string
}

export type Input = io.Input & Extension
