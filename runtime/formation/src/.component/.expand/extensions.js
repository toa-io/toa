'use strict'

const { recognize } = require('../../lookup')

function extensions (manifest) {
  recognize(manifest, 'extensions')
  recognize(manifest.extensions)
}

exports.extensions = extensions
