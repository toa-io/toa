'use strict'

const { deploy } = require('../handlers/deploy')

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
    .option('dry', {
      alias: 'd',
      group: 'Command options:',
      boolean: true,
      desc: 'Dry run'
    })
    .option('wait', {
      alias: 'w',
      group: 'Command options:',
      boolean: true,
      desc: 'Wait for deployment ready state'
    })
}

exports.command = 'deploy [environment]'
exports.desc = 'Deploy context'
exports.builder = builder
exports.handler = deploy
