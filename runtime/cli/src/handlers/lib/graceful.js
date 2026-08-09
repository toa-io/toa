'use strict'

const { console, flush } = require('openspan')

function graceful (connector) {
  ['SIGTERM', 'SIGINT']
    .forEach(signal => process.once(signal, async () => {
      console.info('Shutting down', { signal })

      await connector.disconnect()

      // process.exit() does not emit 'beforeExit', so flush span exporters explicitly
      await flush()

      process.exit(0)
    }))
}

exports.graceful = graceful
