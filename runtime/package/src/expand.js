'use strict'

const expand = (manifest) => {
  schema(manifest.entity?.schema)

  if (typeof manifest.entity?.storage === 'string') manifest.entity.storage = { connector: manifest.entity.storage }

  if (manifest.operations instanceof Array) {
    for (const operation of manifest.operations) {
      dereference(manifest.entity?.schema, operation?.input)
      dereference(manifest.entity?.schema, operation?.output)
      schema(operation?.input)
      schema(operation?.output)
    }
  }
}

const schema = (schema) => {
  if (!schema) return

  for (const [name, value] of Object.entries(schema.properties)) {
    if (typeof value === 'string') schema.properties[name] = { type: value }
  }
}

const dereference = (entity, schema) => {
  if (!entity || !schema?.properties) return

  for (const [name, value] of Object.entries(schema.properties)) {
    if (value === null) schema.properties[name] = entity.properties[name]

    if (typeof value === 'string' && value[0] === '~') {
      schema.properties[name] = entity.properties[value.substr(1)]
    }
  }
}

exports.expand = expand
