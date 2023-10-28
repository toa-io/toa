'use strict'

const { shell } = require('../handlers/shell')

const builder = (yargs) => {
  yargs
    .positional('image', {
      group: 'Command options:',
      type: 'string',
      desc: 'Docker image',
      default: 'alpine'
    })
    .example([
      ['$0 shell'],
      ['$0 shell -- ping localhost']
    ])
}

exports.command = 'shell [image]'
exports.desc = 'Run interactive shell from the current Kubernetes context'
exports.builder = builder
exports.handler = shell
