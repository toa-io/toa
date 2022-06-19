'use strict'

const { serve } = require('../handlers/serve')

const builder = (yargs) => {
  yargs
    .positional('path', {
      group: 'Command options:',
      type: 'string',
      desc: 'Path to package',
      default: '.'
    })
    .positional('name', {
      type: 'string',
      desc: 'Service name',
      default: 'default'
    })
}

exports.command = 'serve [path] [name]'
exports.desc = 'Run service'
exports.builder = builder
exports.handler = serve
