'use strict'

const { mono } = require('../handlers/mono')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to a Context',
      default: '.'
    })
    .option('kill', {
      group: 'Command options:',
      type: 'boolean',
      desc: 'Immediate shutdown'
    })
}

exports.command = 'mono [path]'
exports.desc = 'Run composition and services'
exports.builder = builder
exports.handler = mono
