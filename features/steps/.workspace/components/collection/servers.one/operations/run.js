'use strict'

const http = require('node:http')
const { once } = require('node:events')

export class Computation {
  server

  constructor () {
    this.server = http.createServer((request, response) => {
      response.writeHead(200, { 'Content-Type': 'text/plain' })
      response.end('Hello World\n')
    })
  }

  async mount () {
    this.server.listen(3000)

    await once(this.server, 'listening')
  }

  async unmount () {
    this.server.close()

    await once(this.server, 'close')
  }

  async execute () {
    return 1
  }
}
