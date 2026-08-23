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
    .option('mono', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Build a single image'
    })
}

exports.command = 'build'
exports.desc = 'Build Docker images'
exports.builder = builder
exports.handler = build
