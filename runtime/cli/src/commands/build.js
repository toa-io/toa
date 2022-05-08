'use strict'

const { build } = require('../handlers/build')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .option('output', {
      group: 'Command options:',
      boolean: true,
      desc: 'Print log to stdout'
    })
}

exports.command = 'build [path]'
exports.desc = 'Build and push Context Docker images'
exports.builder = builder
exports.handler = build
