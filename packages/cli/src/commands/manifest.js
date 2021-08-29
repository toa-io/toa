'use strict'

const { manifest } = require('../handlers/manifest')

const builder = (yargs) => {
  yargs.usage('Usage: kookaburra manifest --path=/path/to/component')
}

exports.desc = 'Print manifest'
exports.builder = builder
exports.handler = manifest
