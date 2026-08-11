import type { telemetry } from '@toa.io/types'
import type { Trust } from '../types'
import type { Fetch } from '../types/context'

export interface Ctx {
  trust: Trust[]
  logs: telemetry.Logs
  fetch: Fetch
}
