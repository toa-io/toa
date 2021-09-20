'use strict'

const traverse = (manifest) => {
  expand(manifest.entity.schema)

  if (manifest.operations === undefined) return

  for (const operation of manifest.operations) {
    if (operation.input) operation.input = expand(operation.input)
    if (operation.output) operation.output = expand(operation.output)
  }
}

const expand = (object) => {
  if (object === undefined || object === null) return object
  if (typeof object === 'string' && object[0] !== '~') return { type: object }

  if (object.type === 'array') {
    object.items = expand(object.items)
  } else if (object.properties !== undefined) {
    for (const [name, value] of Object.entries(object.properties)) {
      object.properties[name] = expand(value)
    }
  }

  return object
}

exports.expand = traverse
