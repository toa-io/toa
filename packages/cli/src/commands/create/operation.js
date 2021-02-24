'use strict'

const path = require('path')

const { operation } = require('../../handlers/create/operation')

function builder (yargs) {
  yargs
    .usage('Usage: kookaburra create operation add --transition')
    .positional('name', {
      alias: 'n',
      describe: 'Operation name',
      demandOption: true,
      type: 'string'
    })
    .option('transition', {
      alias: 't',
      describe: 'Changes state',
      type: 'boolean',
      default: false
    })
    .default('name', () => path.basename(path.resolve()))
}

exports.command = 'operation <name>'
exports.desc = 'Create operation'
exports.builder = builder
exports.handler = operation
