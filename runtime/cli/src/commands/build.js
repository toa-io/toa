'use strict'

const { build } = require('../handlers/build')

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

exports.command = 'build [environment]'
exports.desc = 'Build and push docker images'
exports.builder = builder
exports.handler = build
