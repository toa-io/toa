'use strict'

const { dump } = require('../../handlers/export/deployment')

const builder = (yargs) => {
  yargs
    .positional('target', {
      type: 'string',
      desc: 'Export target path'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
}

exports.command = 'deployment [target]'
exports.desc = 'Export context deployment'
exports.builder = builder
exports.handler = dump
