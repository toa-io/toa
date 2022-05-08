'use strict'

const { lookup } = require('./lookup')

const expand = (manifest) => {
  if (manifest.entity !== undefined) {
    manifest.entity.schema = schema(manifest.entity.schema, true)
    manifest.entity.storage = lookup(manifest.entity.storage, manifest.path)
  }

  manifest.bridge = lookup(manifest.bridge, manifest.path)

  if (manifest.bindings !== undefined) {
    manifest.bindings = manifest.bindings.map((binding) => lookup(binding, manifest.path))
  }

  if (manifest.operations !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      if (operation.input !== undefined) operation.input = schema(operation.input, true)
      if (operation.output !== undefined) operation.output = schema(operation.output, true)
      if (operation.bridge !== undefined) operation.bridge = lookup(operation.bridge, manifest.path)
    }
  }

  if (manifest.events !== undefined) {
    for (const event of Object.values(manifest.events)) {
      if (event.binding) event.binding = lookup(event.binding, manifest.path)
      if (event.bridge !== undefined) event.bridge = lookup(event.bridge, manifest.path)
    }
  }

  if (manifest.receivers !== undefined) {
    for (const [locator, receiver] of Object.entries(manifest.receivers)) {
      if (typeof receiver === 'string') manifest.receivers[locator] = { transition: receiver }
    }
  }

  // well-known extensions
  for (const extension of EXTENSIONS) {
    if (manifest[extension] !== undefined) {
      if (manifest.extensions === undefined) manifest.extensions = {}

      manifest.extensions[extension] = manifest[extension]
      delete manifest[extension]
    }
  }

  if (manifest.extensions !== undefined) {
    for (const [key, value] of Object.entries(manifest.extensions)) {
      const path = lookup(key, manifest.path)

      manifest.extensions[path] = value
      delete manifest.extensions[key]
    }
  }
}

const schema = (object, root) => {
  if (object === undefined || object === null) return object
  if (typeof object === 'string' && object[0] !== '~') return { type: object }

  if (object.type === 'array') object.items = schema(object.items)
  else if (typeof object === 'object') {
    if (object.properties !== undefined) {
      for (const [name, value] of Object.entries(object.properties)) {
        object.properties[name] = schema(value)
      }
    } else if (object.type === undefined && root === true) return schema({ properties: object })
  }

  return object
}

const EXTENSIONS = ['resources']

exports.expand = expand
