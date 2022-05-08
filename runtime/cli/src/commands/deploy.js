'use strict'

const { deploy } = require('../handlers/deploy')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .option('dry', {
      group: 'Command options:',
      boolean: true,
      desc: 'Dry run'
    })
    .option('wait', {
      group: 'Command options:',
      boolean: true,
      desc: 'Wait for deployment ready state'
    })
}

exports.command = 'deploy [path]'
exports.desc = 'Deploy context'
exports.builder = builder
exports.handler = deploy
