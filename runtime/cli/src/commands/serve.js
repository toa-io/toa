'use strict'

const { serve } = require('../handlers/serve')

const builder = (yargs) => {
  yargs
    .positional('path', {
      group: 'Command options:',
      type: 'string',
      desc: 'Path or a shortcut of an extension'
    })
    .positional('service', {
      group: 'Command options:',
      type: 'string',
      desc: 'Service name'
    })
}

exports.command = 'serve <path> <service>'
exports.desc = 'Run an extension service'
exports.builder = builder
exports.handler = serve
