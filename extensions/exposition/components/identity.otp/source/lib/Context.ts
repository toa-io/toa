import type { Call, Observation } from '@toa.io/core/types'
import type { Stash } from '@toa.io/extensions.stash'
import type { Logs } from '@toa.io/extensions.telemetry'
import type { Entity } from './Entity.js'

export interface Context {
  stash: Stash
  logs: Logs
  local: {
    observe: Observation<Entity>
    ensure: Call<Entity>
  }
  configuration: {
    lifetime: number
    attempts: number
  }
}
