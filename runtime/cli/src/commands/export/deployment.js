'use strict'

const { dump } = require('../../handlers/export/deployment')

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
}

exports.command = 'deployment [path] [target]'
exports.desc = 'Export context deployment'
exports.builder = builder
exports.handler = dump
