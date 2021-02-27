'use strict'

const { resolve } = require('path')

function path (locator, path = '/') {
  if (path.charAt(0) === '/') { path = `.${path}` }
  if (path.charAt(path.length - 1) !== '/') { path = `${path}/` }

  return resolve(`/${locator.name}/`, `${path}`)
}

exports.path = path
