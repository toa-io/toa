'use strict'

const { dump } = require('../../handlers/deploy/export')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .usage('Usage: toa deploy export /path/to/context')
}

exports.command = 'export [path]'
exports.desc = 'Export context deployment'
exports.builder = builder
exports.handler = dump
