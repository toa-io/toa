'use strict'

const { serve } = require('../handlers/serve')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to source',
      default: '.'
    })
}

exports.command = 'serve [path]'
exports.desc = 'Serve process'
exports.builder = builder
exports.handler = serve
