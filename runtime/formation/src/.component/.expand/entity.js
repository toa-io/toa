'use strict'

const { resolve } = require('../../shortcuts')
const { schema } = require('./schema')

function entity (manifest) {
  if (manifest.entity === undefined) return

  manifest.entity.schema = schema(manifest.entity.schema, true)
  manifest.entity.storage = resolve(manifest.entity.storage)
}

exports.entity = entity
