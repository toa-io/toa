'use strict'

const { serve } = require('../handlers/serve')

const builder = (yargs) => {
  yargs
    .positional('name', {
      type: 'string',
      desc: 'Service name'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to package',
      default: '.'
    })
}

exports.command = 'serve [name]'
exports.desc = 'Run service'
exports.builder = builder
exports.handler = serve
