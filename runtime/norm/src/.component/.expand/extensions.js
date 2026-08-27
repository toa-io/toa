'use strict'

const { recognize } = require('../../shortcuts')

function extensions (manifest) {
  recognize(SHORTCUTS, manifest, 'extensions')
  recognize(SHORTCUTS, manifest.extensions)
}

const SHORTCUTS = {
  exposition: '@toa.io/extensions.exposition',
  realtime: '@toa.io/extensions.realtime',
  configuration: '@toa.io/extensions.configuration',
  state: '@toa.io/extensions.state',
  stash: '@toa.io/extensions.stash',
  storages: '@toa.io/extensions.storages',
  introspection: '@toa.io/extensions.introspection'
}

exports.extensions = extensions
