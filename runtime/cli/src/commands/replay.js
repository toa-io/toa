'use strict'

const { replay } = require('../handlers/replay')

const builder = (yargs) => {
  yargs
    .positional('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to component or context',
      default: '.'
    })
}

exports.command = 'replay [path]'
exports.desc = 'Replay samples'
exports.builder = builder
exports.handler = replay
