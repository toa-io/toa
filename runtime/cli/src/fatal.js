import { console, logging, printing, shutdown, sinks } from 'openspan'

/**
 * The process leaves on a failure nobody handled, and says why first.
 *
 * Whoever runs it reads the error on stderr, printed as it always was. Where nothing collects its
 * streams, though, the log is all that is left of it: the error goes there too, as one record, to
 * every log exporter but the console — which would only print it again, as a line nobody runs the
 * program to read.
 *
 * What was observed and not yet sent goes before it leaves: `process.exit()` emits no
 * `beforeExit`, and the record above is among it. Flushing is bounded by each exporter's own
 * request timeout and never rejects, so it cannot keep a broken process alive.
 *
 * A process leaves once: a failure that follows the first while it is leaving — the same error
 * rethrown on its way out, or one of what is still running — is not another record.
 *
 * @param {string} reason what failed: `uncaught exception`, `unhandled rejection` or `command failed`
 * @param {unknown} error
 * @returns {Promise<void>}
 */
export function fatal(reason, error) {
  leaving ??= leave(reason, error)

  return leaving
}

/** @type {Promise<void> | undefined} */
let leaving

/**
 * @param {string} reason
 * @param {unknown} error
 * @returns {Promise<void>}
 */
async function leave(reason, error) {
  try {
    globalThis.console.error(error)

    // the process is leaving: what it writes from here on is this record
    logging(sinks().filter((sink) => !printing(sink)))
    console.error('Process failed', { reason, error })

    await shutdown()
  } finally {
    process.exit(error?.exitCode > 0 ? error.exitCode : 1)
  }
}
