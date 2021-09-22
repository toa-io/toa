'use strict'

const { dirname, resolve } = require('path')

const lookup = (reference, base) => {
  try {
    return dirname(require.resolve(reference, { paths: base ? [base] : undefined }))
  } catch (e) {
    return resolve(base, reference)
  }
}

exports.lookup = lookup
