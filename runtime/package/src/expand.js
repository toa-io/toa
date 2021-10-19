'use strict'

const { lookup } = require('@toa.io/gears')

const expand = (manifest) => {
  if (manifest.entity?.schema) schema(manifest.entity.schema)

  if (manifest.bindings !== undefined) {
    manifest.bindings = manifest.bindings.map((binding) => lookup(binding))
  }

  if (manifest.operations !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      if (operation.input) operation.input = schema(operation.input)
      if (operation.output) operation.output = schema(operation.output)
    }
  }

  if (manifest.events !== undefined) {
    for (const event of Object.values(manifest.events)) {
      if (event.binding) event.binding = lookup(event.binding)
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
}

const schema = (object) => {
  if (object === undefined || object === null) return object
  if (typeof object === 'string' && object[0] !== '~') return { type: object }

  if (object.type === 'array') {
    object.items = schema(object.items)
  } else if (object.properties !== undefined) {
    for (const [name, value] of Object.entries(object.properties)) {
      object.properties[name] = schema(value)
    }
  }

  return object
}

const EXTENSIONS = ['resources']

exports.expand = expand
