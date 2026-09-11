import * as stage from '@toa.io/userland/stage'
import { environment } from '@toa.io/generic'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Before, BeforeAll, After } from '@cucumber/cucumber'

BeforeAll(() => {
  // the store, not `process.env`: the runtime reads the former, and a component's code must
  // find nothing in the latter — see `environment` in @toa.io/generic
  environment.set('TOA_DEV', '1')

  // a reply is checked against what the operation declares, so the suite runs Toa under the
  // contract it asks applications to keep
  fallback('TOA_ENV', 'local')

  // the outbox pumps on a tick; at the default five seconds a scenario would
  // end before it ran
  fallback('TOA_OUTBOX_INTERVAL', '100')
  fallback('TOA_CADENCE_DISCRETENESS', '100')

  // the readiness probe every composition here brings up. 8001, what a deployment declares,
  // is where an application served on this machine has its own — and the probe skips a port
  // already taken, so a scenario would read that one's answer instead of failing
  fallback('TOA_TELEMETRY_READY', JSON.stringify({ port: 31001 }))

  // the UIs a composed `configuration` or `introspection` service publishes. 8002 and 8003,
  // what a deployment publishes, are where an application served on this machine has its own
  fallback('TOA_INTROSPECTION_UI_PORT', '31002')
  fallback('TOA_CONFIGURATION_UI_PORT', '31003')

  // a replica reads nothing until it knows which lanes are its own, so recovery is only
  // observable with coordination running; it takes two agreeing intervals to hand out a pair
  fallback('TOA_ATOMICITY_REDIS', 'redis://localhost:31040')
  fallback('TOA_ATOMICITY_INTERVAL', '150')
})

/** What the shell set wins, wherever it was absorbed to. */
function fallback(name, value) {
  if (!environment.has(name)) environment.set(name, value)
}

Before(
  /**
   * @this {toa.features.Context}
   */
  async function () {
    this.cwd = await mkdtemp(join(tmpdir(), Math.random().toString(36).slice(2)))
    this.containers = {}
  }
)

// a workspace holds whatever its scenario wrote there, an exported image among it, and /tmp is
// memory
After(async function () {
  try {
    await stage.shutdown()
  } finally {
    await rm(this.cwd, { recursive: true, force: true, maxRetries: 3 })
  }
})
