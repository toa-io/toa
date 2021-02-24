'use strict'

const { handler } = require('../handlers/invoke')

exports.command = 'invoke <operation>'
exports.desc = 'Invoke operation'
exports.builder = {
  input: {}
}
exports.handler = handler
