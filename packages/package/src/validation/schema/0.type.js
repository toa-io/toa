'use strict'

const def = schema => {
  if (schema.type === undefined) schema.type = 'object'
}

exports.checks = [def]
