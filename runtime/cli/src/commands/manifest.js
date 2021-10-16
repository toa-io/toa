'use strict'

const { manifest } = require('../handlers/manifest')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to component',
      default: '.'
    })
    .usage('Usage: toa manifest /path/to/component')
}

exports.command = 'manifest [path]'
exports.desc = 'Print manifest'
exports.builder = builder
exports.handler = manifest
