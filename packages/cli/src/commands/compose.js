'use strict'

const { handler } = require('../handlers/compose')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to component',
      default: '.'
    })
    .array('path')
    .option('http.port', {
      type: 'number',
      describe: 'Port',
      default: 3000
    })
    .example([
      ['$0 compose ./first ./second', 'Paths enumeration'],
      ['$0 compose ./components/**/', 'Glob pattern'],
      ['$0 compose --http.port=80', 'Use port 80 for HTTP server']
    ])
    .group('http.port', 'HTTP server options')
}

exports.command = 'compose [path...]'
exports.desc = 'Start Runtime Composition'
exports.builder = builder
exports.handler = handler
