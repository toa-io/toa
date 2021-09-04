'use strict'

const { Transport } = require('./transport')
const { Producer } = require('./producer')

class Factory {
  producer (runtimes) {
    const transport = new Transport()
    const producer = new Producer(transport)

    runtimes.forEach((runtime) => producer.bind(runtime))

    return producer
  }
}

exports.Factory = Factory
