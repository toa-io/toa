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

  const properties = { ...entity.properties, id }

  const property = (name) => {
    if (properties[name] === undefined) throw new Error(`Referenced property '${name}' is not defined`)

    return properties[name]
  }

  for (const [name, value] of Object.entries(schema.properties)) {
    if (value === null) schema.properties[name] = property(name)

    if (typeof value === 'string' && value[0] === '~') {
      schema.properties[name] = property(value.substr(1))
    }
  }
}

const id = { type: 'string', pattern: '^[a-fA-F0-9]+$' }

exports.expand = expand
