'use strict'

const { dump } = require('../../handlers/export/deployment')

const builder = (yargs) => {
  yargs
    .positional('target', {
      type: 'string',
      desc: 'Path to export to'
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

exports.command = ['deployment <environment> <target>', 'dep']
exports.desc = 'Export context deployment'
exports.builder = builder
exports.handler = dump
