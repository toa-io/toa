'use strict'

const { connector } = require('@toa.io/generics.amqp')
const { Storage } = require('./storage')

/**
 * @implements {toa.core.storages.Factory}
 */
class Factory {
  storage (locator, properties) {
    const comm = connector(PREFIX, locator)

    return new Storage(comm, /** @type {toa.queues.Properties} */ properties)
  }
}

const PREFIX = 'storages-queues-amqp'

exports.Factory = Factory
