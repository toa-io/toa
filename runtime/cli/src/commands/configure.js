'use strict'

const { configure } = require('../handlers/configure')

const builder = (yargs) => {
  yargs
    .positional('key', {
      type: 'string',
      desc: 'Configuration Object key'
    })
    .positional('value', {
      type: 'string',
      desc: 'Key value'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      describe: 'Path to component',
      type: 'string',
      default: '.'
    })
    .option('reset', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Remove Configuration Object key'
    })
    .example([
      ['$0 configure myKey \'new value\' | source /dev/stdin'],
      ['$0 configure myObject.myKey --reset | source /dev/stdin'],
      ['$0 configure reset | source /dev/stdin'],
      ['$0 configure print']
    ])
}

exports.command = 'configure [key] [value]'
exports.desc = 'Output shell command to update local environment Configuration Object'
exports.builder = builder
exports.handler = configure
