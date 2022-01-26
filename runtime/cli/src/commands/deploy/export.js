'use strict'

const { dump } = require('../../handlers/deploy/export')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .positional('target', {
      type: 'string',
      desc: 'Export target path'
    })
    .usage('Usage: toa deploy export /path/to/context /export/path')
}

exports.command = 'export [path] [target]'
exports.desc = 'Export context deployment chart'
exports.builder = builder
exports.handler = dump
