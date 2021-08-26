'use strict'

const { Transport } = require('./transport')
const { Server } = require('./server')

class Factory {
  server (runtimes) {
    const transport = new Transport()
    const server = new Server(transport)

    runtimes.forEach((runtime) => server.bind(runtime))

    return server
  }
}

exports.Factory = Factory
