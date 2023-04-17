'use strict'

const { join, dirname } = require('node:path')

/**
 * @param {toa.norm.Component} component
 */
const dependencies = (component) => {
  if ('entity' in component) component.entity.storage = resolve(component.path, component.entity.storage)
}

function resolve (root, reference) {
  const paths = [root, __dirname]
  const options = { paths }

  let path

  try { // as package
    const packageJsonRef = join(reference, 'package.json')

    path = require.resolve(packageJsonRef, options)
  } catch { // as directory
    path = require.resolve(reference, options)
  }

  return dirname(path)
}

exports.dependencies = dependencies
