'use strict'

const path = require('path')

const { validation } = require('../validation')

const defined = schema => schema.properties !== undefined && schema.properties !== null
defined.message = 'entity schema has no properties'
defined.fatal = false
defined.break = schema => !defined(schema)

const object = schema => typeof schema.properties === 'object'
object.message = 'entity schema properties must be an object'
object.fatal = true

const nonempty = schema => Object.keys(schema.properties).length > 0
nonempty.message = 'entity schema has no properties'
nonempty.fatal = false
nonempty.break = schema => !nonempty(schema)

const properties = async (schema, manifest) => {
  const checks = validation(path.resolve(__dirname, './property'))

  for (const key of Object.keys(schema.properties)) {
    await checks({ properties: schema.properties, key }, manifest)
  }
}

exports.checks = [defined, object, nonempty, properties]
