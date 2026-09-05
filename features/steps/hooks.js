import * as stage from '@toa.io/userland/stage'
import { mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Before, BeforeAll, After } from '@cucumber/cucumber'

BeforeAll(() => {
  process.env.TOA_DEV = '1'

  // a reply is checked against what the operation declares, so the suite runs Toa under the
  // contract it asks applications to keep
  process.env.TOA_ENV ??= 'local'

  // the outbox pumps on a tick; at the default five seconds a scenario would
  // end before it ran
  process.env.TOA_OUTBOX_INTERVAL ??= '100'
  process.env.TOA_CADENCE_DISCRETENESS ??= '100'

  // the readiness probe every composition here brings up. 8001, what a deployment declares,
  // is where an application served on this machine has its own — and the probe skips a port
  // already taken, so a scenario would read that one's answer instead of failing
  process.env.TOA_TELEMETRY_READY ??= JSON.stringify({ port: 31001 })

  // the UIs a composed `configuration` or `introspection` service publishes. 8002 and 8003,
  // what a deployment publishes, are where an application served on this machine has its own
  process.env.TOA_INTROSPECTION_UI_PORT ??= '31002'
  process.env.TOA_CONFIGURATION_UI_PORT ??= '31003'

  // a replica reads nothing until it knows which lanes are its own, so recovery is only
  // observable with coordination running; it takes two agreeing intervals to hand out a pair
  process.env.TOA_ATOMICITY_REDIS ??= 'redis://localhost:31040'
  process.env.TOA_ATOMICITY_INTERVAL ??= '150'
})

Before(
  /**
   * @this {toa.features.Context}
   */
  async function() {
    this.cwd = await mkdtemp(join(tmpdir(), Math.random().toString(36).slice(2)))
    this.containers = {}
  })

After(
  async function() {
    await stage.shutdown()
  })
