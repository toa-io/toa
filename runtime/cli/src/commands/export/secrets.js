'use strict'

const { secrets } = require('../../handlers/export/secrets')

const builder = (yargs) => {
  yargs
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

exports.command = ['secrets <environment>']
exports.desc = 'Export deployment secrets'
exports.builder = builder
exports.handler = secrets
