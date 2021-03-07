'use strict'

const { Binding, Server } = require('@kookaburra/http')

function http (options) {
  const server = new Server(options)
  const binding = new Binding(server)

  return binding
}

exports.http = http
