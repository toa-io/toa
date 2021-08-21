'use strict'

const path = require('path')

const { yaml } = require('@kookaburra/gears')
const { validation } = require('../../validation')

const defined = (entity) => entity.schema !== undefined && entity.schema !== null
defined.message = 'entity has no schema'
defined.fatal = true

const schema = (entity, manifest) =>
  validation(path.resolve(__dirname, '../../schema'))(entity.schema, manifest, 'entity')

const id = (entity) => entity.schema.properties?.id === undefined
id.message = 'property \'id\' is predefined'
id.fatal = true

const system = yaml.sync(path.resolve(__dirname, '../../schemas/system.yaml'))
const add = (entity) => {
  entity.schema = {
    ...entity.schema,
    properties: { ...system.properties, ...entity.schema.properties },
    required: system.required.concat(entity.schema.required || [])
  }
}

exports.checks = [defined, schema, id, add]
