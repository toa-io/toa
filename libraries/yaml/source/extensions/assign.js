'use strict'

const { resolve, dirname } = require('node:path')
const { traverse, add, plain } = require('@toa.io/generic')
const { file } = require('@toa.io/filesystem')

/** @type {toa.yaml.extension} */
const assign = (object, path, yaml) => {
  if (Array.isArray(object)) return object.map(item => assign(item, path, yaml))
  else return walk(object, path, yaml)
}

/** @type {toa.yaml.extension} */
const walk = (object, path, yaml) => {
  return traverse(object, (node) => {
    if ('<assign' in node) extend(node, path, yaml)

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) assign(value, path, yaml)
    }
  })
}

/**
 * @param {{'<assign'?: string}} node
 * @param {string} [path]
 * @param {{load: { sync: (string) => object }}} [yaml]
 */
function extend (node, path, yaml) {
  const basepath = dirname(path)
  const reference = resolve(basepath, node['<assign'])
  const [pattern, fragment] = reference.split('#')
  const files = file.glob.sync(pattern).filter((file) => file !== path)

  if (files.length === 0) throw new Error(`No files matching pattern '${pattern}'`)

  const contents = files.map((path) => yaml.load.sync(path))
  const objects = contents.map((object) => extract(object, fragment))

  delete node['<assign']

  return objects.reduce((node, object) => add(node, object), node)
}

function extract (object, fragment) {
  if (fragment === undefined) return object

  const segments = fragment.split('/')
  let cursor = object

  for (const segment of segments) {
    cursor = cursor[segment]

    if (!plain(cursor)) throw new Error('<assign: fragment must be plain object')
  }

  return cursor
}

exports.assign = assign
