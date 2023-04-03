'use strict'

const { recognize } = require('../../shortcuts')

function properties (manifest) {
  recognize(SHORTCUTS, manifest, 'properties')
  recognize(SHORTCUTS, manifest.properties)
}

const SHORTCUTS = {
  queues: '@toa.io/storages.queues'
}

exports.properties = properties
