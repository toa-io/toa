// noinspection JSCheckFunctionSignatures

'use strict'

const { replay } = require('../handlers/replay')

const builder = (yargs) => {
  yargs
    .positional('paths', {
      type: 'string',
      desc: 'Paths to components or context',
      default: '.'
    })
}

exports.command = 'replay [paths...]'
exports.desc = 'Replay samples'
exports.builder = builder
exports.handler = replay
