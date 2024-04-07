'use strict'

function graceful (connector) {
  ['SIGTERM', 'SIGINT']
    .forEach(event => process.once(event, async () => {
      console.info(event)

      await connector.disconnect()
    }))
}

exports.graceful = graceful
