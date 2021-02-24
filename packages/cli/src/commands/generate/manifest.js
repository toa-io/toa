'use strict'

const path = require('path')

const { manifest } = require('../../handlers/generate/manifest')

function builder (yargs) {
  yargs
    .option('name', {
      describe: 'Component name (defaults to current directory name)',
      type: 'string'
    })
    .default('name', () => path.basename(path.resolve()))
    .alias('n', 'name')
    .usage('Usage: kookaburra generate manifest --name dummy')
}

exports.command = 'manifest'
exports.desc = 'Generate manifest'
exports.builder = builder
exports.handler = manifest
