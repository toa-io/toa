'use strict'

const { resolve } = require('../../shortcuts')

function entity (manifest) {
  if (!('entity' in manifest)) return

  manifest.entity.storage = resolve(manifest.entity.storage)
}

exports.entity = entity
