'use strict'

const path = require('path')

const { validation } = require('../validation')

const defined = (manifest) => manifest.operations !== undefined
defined.message = 'has no operations'
defined.fatal = true

const array = (manifest) => Array.isArray(manifest.operations)
array.message = 'manifest \'operations\' property must be an array'
array.fatal = true

const nonempty = (manifest) => manifest.operations.length > 0
nonempty.message = defined.message
nonempty.fatal = true

const operations = async (manifest) => {
  const checks = validation(path.resolve(__dirname, './operation'))

  for (const operation of manifest.operations) { await checks(operation, manifest) }
}

exports.checks = [defined, array, nonempty, operations]
