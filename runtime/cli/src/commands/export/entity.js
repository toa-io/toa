'use strict'

const { manifest } = require('../../handlers/export/entity')

const builder = (yargs) => {
  yargs
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to a component',
      default: '.'
    })
    .option('output', {
      alias: 'o',
      group: 'Command options:',
      choices: ['yaml', 'json'],
      desc: 'Output format',
      default: 'yaml'
    })
}

exports.command = 'entity'
exports.desc = 'Print entity'
exports.builder = builder
exports.handler = manifest
