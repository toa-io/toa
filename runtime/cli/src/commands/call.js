'use strict'

const { call } = require('../handlers/call')

const builder = (yargs) => {
  yargs
    .positional('endpoint', {
      type: 'string',
      desc: 'Operation endpoint'
    })
    .positional('request', {
      type: 'string',
      desc: 'Request object'
    })
}

exports.command = 'call <endpoint> [request]'
exports.desc = 'Call operation'
exports.builder = builder
exports.handler = call
