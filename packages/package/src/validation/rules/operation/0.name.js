'use strict'

const def = (operation) => operation.name !== undefined
def.message = 'operation does not have a name'
def.fatal = true

exports.checks = [def]
