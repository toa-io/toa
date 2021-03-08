'use strict'

const def = schema => {
  if (schema.type === undefined) schema.type = 'object'
}

const object = schema => schema.type === 'object'
object.message = 'Schemas must be an object type'
object.fatal = true

exports.checks = [def, object]
