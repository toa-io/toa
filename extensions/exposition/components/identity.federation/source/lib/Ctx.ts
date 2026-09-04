import type { Logs } from '@toa.io/extensions.telemetry'
import type { Trust } from '../types/index.js'
import type { Fetch } from '../types/context.js'

export interface Ctx {
  trust: Trust[]
  logs: Logs
  fetch: Fetch
}
