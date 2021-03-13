'use strict'

const path = require('path')

const { yaml } = require('@kookaburra/gears')
const { validation } = require('../../validation')

const defined = (entity) => entity.schema !== undefined && entity.schema !== null
defined.message = 'entity has no schema'
defined.fatal = true

const schema = async (entity, manifest) =>
  await validation(path.resolve(__dirname, '../../schema'))(entity.schema, manifest, 'entity')

let system
const add = async (entity) => {
  if (!system) { system = await yaml(path.resolve(__dirname, '../../schemas/system.yaml')) }

  entity.schema = {
    ...entity.schema,
    properties: { ...system.properties, ...entity.schema.properties },
    required: system.required.concat(entity.schema.required || [])
  }
}

exports.checks = [defined, schema, add]
