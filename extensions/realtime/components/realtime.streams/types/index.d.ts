export * from './toa.d.ts'

// What a manifest does not state belongs here, and every run keeps it.

import type { Logs } from '@toa.io/extensions.telemetry'
import type { Stash as Redis } from '@toa.io/extensions.stash'
import type { Configuration } from './toa.d.ts'
import type { Stream } from '../source/lib/Stream.ts'
import type { Stash } from '../source/lib/Stash.ts'

/** What this component keeps between calls: the streams it serves, and what backs them. */
export interface Context {
  stash: Redis
  state: {
    streams: Map<string, Stream>
    stash: Stash
  }
  logs: Logs
  configuration: Configuration
}
