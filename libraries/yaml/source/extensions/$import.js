'use strict'

const { resolve, dirname } = require('node:path')
const { traverse, merge } = require('@toa.io/generic')
const { file } = require('@toa.io/filesystem')

/**
 * @param {{$import: string}} node
 * @param {string} [path]
 * @param {{load: { sync: (string) => object }}} [yaml]
 */
function extend (node, path, yaml) {
  const basepath = dirname(path)
  const pattern = resolve(basepath, node.$import)
  const files = file.glob.sync(pattern).filter((file) => file !== path)
  const objects = files.map((path) => yaml.load.sync(path))

  delete node.$import

  return objects.reduce((node, object) => merge(node, object), node)
}

/** @type {toa.yaml.extension} */
const $import = (object, path, yaml) => {
  return traverse(object, (node) => {
    if ('$import' in node) extend(node, path, yaml)
  })
}

module.exports = $import
