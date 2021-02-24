'use strict'

const path = require('path')

const { manifest } = require('../../handlers/create/manifest')

function builder (yargs) {
  yargs
    .option('name', {
      describe: 'Component name (defaults to current directory name)',
      type: 'string'
    })
    .default('name', () => path.basename(path.resolve()))
    .alias('n', 'name')
    .usage('Usage: kookaburra create manifest --name dummy')
}

exports.command = 'manifest'
exports.desc = 'Create manifest'
exports.builder = builder
exports.handler = manifest
