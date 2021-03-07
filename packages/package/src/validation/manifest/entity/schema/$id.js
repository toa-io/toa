'use strict'

const { concat } = require('@kookaburra/gears')

const def = (schema, { domain, name }) => {
  if (schema.$id === undefined) { schema.$id = `schema://${concat(domain, '/')}${name}/entity` }
}

const string = (schema) => typeof schema.$id === 'string'
string.message = 'schema $id must be string'
string.fatal = true

const nonempty = (schema) => schema.$id.length > 0
string.message = 'schema $id can\'t be empty string'
string.fatal = true

exports.checks = [def, string, nonempty]
