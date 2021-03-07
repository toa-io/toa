'use strict'

const path = require('path')

const { validation } = require('../../../validation')

const object = (schema) => typeof schema.properties === 'object'
object.message = 'entity schema properties must be an object'
object.fatal = true

const nonempty = (schema) => Object.keys(schema.properties).length > 0
nonempty.message = 'entity schema has no properties'
nonempty.fatal = true

const properties = async (schema, manifest) => {
  const checks = validation(path.resolve(__dirname, './property'))

  for (const key of Object.keys(schema.properties)) {
    await checks({ properties: schema.properties, key }, manifest)
  }
}

exports.checks = [object, nonempty, properties]
