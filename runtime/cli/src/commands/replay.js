// noinspection JSCheckFunctionSignatures

'use strict'

const { replay } = require('../handlers/replay')

/*
!!! OPTIONS MUST BE SYNCHRONIZED WITH ../handlers/.replay/args !!!
 */

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
    .option('autonomous', {
      alias: 'a',
      type: 'boolean',
      group: 'Command options:',
      describe: 'Replay autonomous tests only'
    })
    .option('integration', {
      alias: 'i',
      type: 'boolean',
      group: 'Command options:',
      describe: 'Replay integration tests only'
    })
    .option('operation', {
      alias: 'o',
      type: 'string',
      group: 'Command options:',
      describe: 'Replay samples for specified operation'
    })
    .option('title', {
      alias: 't',
      type: 'string',
      group: 'Command options:',
      describe: 'Replay samples with titles matching given regexp'
    })
    .option('dock', {
      alias: 'd',
      type: 'boolean',
      default: false,
      group: 'Command options:',
      describe: 'Replay inside Docker container'
    })
}

exports.command = 'replay [paths...]'
exports.desc = 'Replay samples'
exports.builder = builder
exports.handler = replay
