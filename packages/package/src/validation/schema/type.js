'use strict'

const { sets } = require('@kookaburra/gears')

const def = schema => {
  if (schema.type === undefined) schema.type = 'object'
}

const object = schema => {
  return schema.type === 'object' ||
    sets.same(schema.type, ['object', 'null']) ||
    sets.same(schema.type, ['object', null])
}
object.message = 'Schemas must be an object type'
object.fatal = true

exports.checks = [def, object]
