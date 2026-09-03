import type { Observation, Stash, Transition } from '@toa.io/types'
import type { Logs } from '@toa.io/extensions.telemetry'
import type { Configuration } from './Configuration.js'
import type { Passkey } from './Passkey.js'
import type { Input as UseInput, Output as UseOutput } from '../use.js'

export interface Context {
  configuration: Configuration
  stash: Stash
  logs: Logs
  local: {
    enumerate: Observation<Passkey[], never, Passkey>
    terminate: Transition<void, void, Passkey>
    use: Transition<UseOutput, UseInput>
  }
}
