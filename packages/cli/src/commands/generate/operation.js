'use strict'

const path = require('path')

const { operation } = require('../../handlers/generate/operation')

function builder (yargs) {
  yargs
    .positional('name', {
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
    .alias('n', 'name')
    .usage('Usage: kookaburra generate operation add --transition')
}

exports.command = 'operation <name>'
exports.desc = 'Generate operation'
exports.builder = builder
exports.handler = operation
