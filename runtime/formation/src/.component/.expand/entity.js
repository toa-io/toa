'use strict'

const { resolve } = require('../../lookup')
const { schema } = require('./schema')

function entity (manifest) {
  if (manifest.entity === undefined) return

  manifest.entity.schema = schema(manifest.entity.schema, true)
  manifest.entity.storage = resolve(manifest.entity.storage, manifest.path)
}

exports.entity = entity
