'use strict'

const path = require('path')

const { Package } = require('@kookaburra/package')

const dummies = path.dirname(require.resolve('@kookaburra/dummies'))

const paths = [
  path.resolve(dummies, 'simple'),
  path.resolve(dummies, 'calculator')
]

const components = Promise.all(paths.map(path => Package.load(path)))

exports.paths = paths
exports.components = components
