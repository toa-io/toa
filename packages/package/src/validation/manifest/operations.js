'use strict'

const { defined } = require('../commons')

const def = defined('operations')
def.message = 'has no operations'

const array = (manifest) => Array.isArray(manifest.operations)
array.message = 'manifest \'operations\' property must be an array'
array.fatal = true

const nonempty = (manifest) => manifest.operations.length > 0
nonempty.message = def.message
nonempty.fatal = true

exports.checks = [def, array, nonempty]
