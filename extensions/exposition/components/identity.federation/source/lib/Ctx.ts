import type { telemetry } from '@toa.io/types'
import type { Trust } from '../types'

export interface Ctx {
  trust: Trust[]
  logs: telemetry.Logs
}
