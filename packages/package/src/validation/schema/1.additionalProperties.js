'use strict'

const def = schema => {
  if (schema.type === 'object' && schema.additionalProperties === undefined) schema.additionalProperties = false
}

const falsy = schema => schema.type !== 'object' || schema.additionalProperties === false
falsy.message = (schema, manifest, id) => `${id} schema additional properties is not allowed`
falsy.fatal = true

exports.checks = [def, falsy]
