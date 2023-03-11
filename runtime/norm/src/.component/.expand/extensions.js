'use strict'

const { recognize } = require('../../shortcuts')

function extensions (manifest) {
  recognize(manifest, 'extensions')
  recognize(manifest.extensions)
}

exports.extensions = extensions
