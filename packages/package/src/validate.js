'use strict'

const path = require('path')

const { validation } = require('./validation/validation')

const manifest = validation(path.resolve(__dirname, './validation/rules'))

function dupes (a, b, message) {
  if (!b) { return }

  Object.keys(a).forEach(key => {
    if (key === 'name') { return }

    if (key in b && a[key] !== b[key]) {
      throw new Error(`${message} for '${a.name}' conflicts on key '${key}' (${a[key]}, ${b[key]})`)
    }
  })
}

exports.manifest = manifest
exports.dupes = dupes
