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
      boolean: true,
      desc: 'Dry run'
    })
    .option('no-wait', {
      boolean: true,
      desc: 'Disable waiting for deployment ready state'
    })
    .usage('Usage: toa deploy /path/to/context')
    .commandDir('./deploy')
}

exports.command = 'deploy [path]'
exports.desc = 'Deploy context'
exports.builder = builder
exports.handler = deploy
