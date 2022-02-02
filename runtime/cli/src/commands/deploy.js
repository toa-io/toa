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
    .option('no-wait', {
      group: 'Command options:',
      boolean: true,
      desc: 'Disable waiting for deployment ready state'
    })
    .option('output', {
      group: 'Command options:',
      boolean: true,
      desc: 'Print log to stdout'
    })
}

exports.command = 'deploy [path]'
exports.desc = 'Deploy context'
exports.builder = builder
exports.handler = deploy
