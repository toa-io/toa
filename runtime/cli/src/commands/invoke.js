'use strict'

const { invoke } = require('../handlers/invoke')

const builder = (yargs) => {
  yargs
    .positional('operation', {
      type: 'string',
      desc: 'Operation name'
    })
    .positional('request', {
      type: 'string',
      desc: 'Request YAML'
    })
    .option('bindings', {
      group: 'Command options:',
      type: 'string',
      desc: 'Bindings'
    })
    .option('path', {
      group: 'Command options:',
      type: 'string',
      describe: 'Path to component',
      default: '.'
    })
}

exports.command = 'invoke <operation> [request]'
exports.desc = 'Invoke Operation'
exports.builder = builder
exports.handler = invoke
