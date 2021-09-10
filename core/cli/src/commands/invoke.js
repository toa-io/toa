'use strict'

const { invoke } = require('../handlers/invoke')

const builder = (yargs) => {
  yargs
    .usage('Usage: kookaburra invoke update "{ foo: \'bar\' }" id=1')
    .positional('operation', {
      type: 'string',
      desc: 'Operation name'
    })
    .positional('query', {
      type: 'string',
      describe: 'RSQL Query',
      default: null
    })
    .positional('input', {
      type: 'string',
      describe: 'JSON input',
      default: null
    })
}

// noinspection RequiredAttributes
exports.command = 'invoke <operation> [input] [query]'
exports.desc = 'Invoke Operation'
exports.builder = builder
exports.handler = invoke
