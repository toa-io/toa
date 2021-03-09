'use strict'

const def = schema => {
  if (schema.additionalProperties === undefined) schema.additionalProperties = false
}

const falsy = schema => schema.additionalProperties === false
falsy.message = 'additional properties not allowed for entities'
falsy.fatal = true

exports.checks = [def, falsy]
