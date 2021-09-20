'use strict'

const { dirname, resolve } = require('path')

const find = (reference, base) => {
  let path

  try {
    path = dirname(require.resolve(reference, { paths: [base] }))
  } catch (e) {
    path = resolve(base, reference)
  }

  return path
}

exports.find = find
