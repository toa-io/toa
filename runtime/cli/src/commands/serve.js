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
}

exports.command = 'serve [path]'
exports.desc = 'Run service'
exports.builder = builder
exports.handler = serve
