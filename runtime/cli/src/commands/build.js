'use strict'

const { build } = require('../handlers/build')

const builder = (yargs) => {
  yargs
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
}

exports.command = 'build'
exports.desc = 'Build and push docker images'
exports.builder = builder
exports.handler = build
