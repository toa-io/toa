import type { Stash, telemetry } from '@toa.io/types'
import type { Trust } from '../types'

export interface Ctx {
  trust: Trust[]
  stash: Stash
  logs: telemetry.Logs
}
