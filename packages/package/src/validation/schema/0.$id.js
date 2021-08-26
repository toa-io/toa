'use strict'

const { concat } = require('@kookaburra/gears')

const def = (schema, { domain, name }, id) => {
  if (schema.$id === undefined) { schema.$id = `http://${concat(domain, '/')}${name}/${id}` }
}

exports.checks = [def]
