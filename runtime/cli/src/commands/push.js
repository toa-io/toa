'use strict'

const { build } = require('../handlers/push')

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

exports.command = 'push [environment]'
exports.desc = 'Build and push Docker images'
exports.builder = builder
exports.handler = build
