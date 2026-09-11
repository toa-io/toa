import type { Logs } from '@toa.io/extensions.telemetry'
import type { Trust } from '../types/index.ts'
import type { Fetch } from '../types/context.ts'

export interface Ctx {
  trust: Trust[]
  logs: Logs
  fetch: Fetch
}
