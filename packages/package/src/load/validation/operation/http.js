'use strict'

const def = (operation) => operation.http === undefined && (operation.http = null)

const array = (operation) => {
  if (!Array.isArray(operation.http)) operation.http = [operation.http]
}

exports.checks = [def, array]
