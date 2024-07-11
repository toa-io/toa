'use strict'

function graceful (connector) {
  ['SIGTERM', 'SIGINT']
    .forEach(event => process.once(event, async () => {
      console.info(`Received ${event}, shutting down...`)

      await connector.disconnect()
    }))
}

exports.graceful = graceful
