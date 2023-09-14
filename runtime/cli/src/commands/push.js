'use strict'

const { push } = require('../handlers/push')

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

exports.command = 'push'
exports.desc = 'Build and push Docker images'
exports.builder = builder
exports.handler = push
