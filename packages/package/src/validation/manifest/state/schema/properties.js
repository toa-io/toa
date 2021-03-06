'use strict'

const path = require('path')

const { validation } = require('../../../validation')

const defined = (schema) => schema.properties !== undefined
defined.message = 'state schema properties must be defined'
defined.fatal = true

const object = (schema) => typeof schema.properties === 'object'
object.message = 'state schema properties must be an object'
object.fatal = true

const nonempty = (schema) => Object.keys(schema.properties).length > 0
nonempty.message = defined.message
nonempty.fatal = true

const properties = async (schema, manifest) => {
  const checks = validation(path.resolve(__dirname, './property'))

  for (const [key] of Object.entries(schema.properties)) {
    await checks({ properties: schema.properties, key }, manifest)
  }
}

exports.checks = [defined, object, nonempty, properties]
