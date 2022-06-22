'use strict'

const http = require('node:http')

let instance
const responses = []

const echo = (req, res) => {
  const response = responses.shift()

  if (response === undefined) {
    res.writeHead(500)
    res.end(JSON.stringify({ error: 'Test error: response is not mocked' }))

    return
  }

  res.writeHead(response.status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(response.body))
}

const server = {
  start: () => {
    instance = http.createServer(echo)
    instance.listen(8000)
  },
  stop: () => {
    instance.close()
  },
  respond: (status, body = {}) => {
    responses.push({ status, body })
  }
}

exports.server = server
