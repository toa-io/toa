'use strict'

const { prepare } = require('../../handlers/export/images')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to context',
      default: '.'
    })
    .positional('target', {
      type: 'string',
      desc: 'Export target path'
    })
}

exports.command = 'images [path] [target]'
exports.desc = 'Export Docker image sources'
exports.builder = builder
exports.handler = prepare
