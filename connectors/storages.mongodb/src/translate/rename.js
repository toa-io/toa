'use strict'

const rename = (name) => {
  return RENAME[name] || name
}

const RENAME = { id: '_id' }

exports.rename = rename
