'use strict'

const { recognize } = require('../../shortcuts')

function extensions (manifest) {
  recognize(SHORTCUTS, manifest, 'extensions')
  recognize(SHORTCUTS, manifest.extensions)
}

const SHORTCUTS = {
  exposition: '@toa.io/extensions.exposition',
  origins: '@toa.io/extensions.origins',
  configuration: '@toa.io/extensions.configuration',
  stash: '@toa.io/extensions.stash'
}

exports.extensions = extensions
