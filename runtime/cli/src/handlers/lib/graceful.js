import { console, flush } from 'openspan'

export function graceful(connector) {
  ;['SIGTERM', 'SIGINT'].forEach((signal) =>
    process.once(signal, async () => {
      console.info('Shutting down', { signal })

      let code = 0

      /*
       * A disconnection that throws is still a disconnection that happened: what it took
       * apart stays apart, and the rest of this is what says so. Left to reject, it would
       * be an unhandled rejection instead, and the process would leave by the last resort
       * in `program.js` — without the flush below, and without the line above being true.
       */
      try {
        await connector.disconnect()
      } catch (error) {
        console.error('Shutdown failed', { signal, error })

        code = 1
      }

      // process.exit() does not emit 'beforeExit', so flush span exporters explicitly
      await flush()

      process.exit(code)
    })
  )
}
