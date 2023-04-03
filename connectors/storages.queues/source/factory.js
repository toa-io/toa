'use strict'

const { connector } = require('@toa.io/generics.amqp')
const { normalize } = require('./properties')
const { Storage } = require('./storage')

/**
 * @implements {toa.core.storages.Factory}
 */
class Factory {
  storage (locator, properties) {
    const comm = connector(PREFIX, locator)

    properties = normalize(properties)

    return new Storage(comm, properties)
  }
}

const PREFIX = 'storages-queues-amqp'

exports.Factory = Factory
