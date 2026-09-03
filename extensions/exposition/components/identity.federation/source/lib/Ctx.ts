import type { telemetry } from '@toa.io/types'
import type { Trust } from '../types/index.js'
import type { Fetch } from '../types/context.js'

export interface Ctx {
  trust: Trust[]
  logs: telemetry.Logs
  fetch: Fetch
}
