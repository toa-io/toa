'use strict'

const { Binding, Server } = require('@kookaburra/http')

/**
 * @returns {Binding}
 */
function http (options) {
  const server = new Server(options)
  const binding = new Binding(server)

  return binding
}

exports.http = http
