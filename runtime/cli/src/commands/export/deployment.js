'use strict'

const { dump } = require('../../handlers/export/deployment')

const builder = (yargs) => {
  yargs
    .positional('target', {
      type: 'string',
      desc: 'Export target path'
    })
    .positional('environment', {
      type: 'string',
      desc: 'Deployment environment'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
}

exports.command = ['deployment <target> [environment]', 'dep']
exports.desc = 'Export context deployment'
exports.builder = builder
exports.handler = dump
