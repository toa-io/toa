'use strict'

const { manifest } = require('../../handlers/export/manifest')

const builder = (yargs) => {
  yargs
    .option('error', {
      alias: 'e',
      group: 'Command options:',
      type: 'boolean',
      desc: 'Print errors only'
    })
    .option('path', {
      alias: 'p',
      group: 'Command options:',
      type: 'string',
      desc: 'Path to a component',
      default: '.'
    })
    .option('jsonpath', {
      alias: 'j',
      group: 'Command options:',
      type: 'string',
      desc: 'JSONPath expression'
    })
    .option('output', {
      alias: 'o',
      group: 'Command options:',
      choices: ['yaml', 'json'],
      desc: 'Output format',
      default: 'yaml'
    })
}

exports.command = ['manifest', 'man']
exports.desc = 'Print manifest'
exports.builder = builder
exports.handler = manifest
