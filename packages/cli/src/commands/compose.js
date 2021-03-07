'use strict'

const { compose } = require('../handlers/compose')

const builder = (yargs) => {
  yargs
    .positional('path', {
      type: 'string',
      desc: 'Path to component',
      default: '.'
    })
    .array('path')
    .option('http', {
      desc: 'HTTP Server options',
      hidden: true
    })
    .option('http.port', {
      type: 'number',
      desc: 'Server port',
      default: 3000
    })
    .group('http.port', 'HTTP server options')
    .option('watch', {
      type: 'boolean',
      desc: 'Restart on file changes',
      default: process.env.NODE_ENV === 'dev'
    })
    .example([
      ['$0 compose ./first ./second', 'Paths enumeration'],
      ['$0 compose ./components/**/', 'Glob pattern'],
      ['$0 compose ./a/**/ ./b/**/', 'Glob pattern enumeration'],
      ['$0 compose --http.port=80', 'Use port 80 for HTTP server']
    ])
    .strictCommands()
}

exports.command = 'compose [path...]'
exports.desc = 'Start Runtime Composition'
exports.builder = builder
exports.handler = compose
