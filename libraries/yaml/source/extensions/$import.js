'use strict'

const { resolve, dirname } = require('node:path')
const { traverse, add } = require('@toa.io/generic')
const { file } = require('@toa.io/filesystem')

/** @type {toa.yaml.extension} */
const $import = (object, path, yaml) => {
  return traverse(object, (node) => {
    if ('$import' in node) extend(node, path, yaml)
  })
}

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

  return objects.reduce((node, object) => add(node, object), node)
}

module.exports = $import
