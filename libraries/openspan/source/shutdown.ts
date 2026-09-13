import { flush } from './exporters.ts'
import { flushLogs } from './sinks.ts'
import { report } from './metrics.ts'

/**
 * What the process has observed and not yet sent, sent — for a shutdown that calls
 * `process.exit()`, which emits no `beforeExit`.
 *
 * All three signals at once: each is bounded by its own request timeout and none of them
 * rejects, so the wait is one timeout rather than three.
 */
export async function shutdown(): Promise<void> {
  await Promise.all([flush(), report(), flushLogs()])
}
