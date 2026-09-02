import type { Call, Observation, Stash, telemetry } from '@toa.io/types'
import type { Entity } from './Entity.js'

export interface Context {
  stash: Stash
  logs: telemetry.Logs
  local: {
    observe: Observation<Entity>
    ensure: Call<Entity>
  }
  configuration: {
    lifetime: number
  }
}
