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
    .option('component', {
      alias: 'c',
      type: 'string',
      group: 'Command options:',
      describe: 'Replay samples for specified component'
    })
    .option('integration', {
      alias: 'i',
      type: 'boolean',
      group: 'Command options:',
      describe: 'Replay integration tests only'
    })
    .option('sample', {
      alias: 's',
      type: 'string',
      group: 'Command options:',
      describe: 'Replay samples found by glob pattern'
    })
    .option('title', {
      alias: 't',
      type: 'string',
      group: 'Command options:',
      describe: 'Replay samples with titles matching regexp'
    })
}

exports.command = 'replay [paths...]'
exports.desc = 'Replay samples'
exports.builder = builder
exports.handler = replay
