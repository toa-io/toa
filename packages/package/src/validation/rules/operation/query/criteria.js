'use strict'

const { concat } = require('@kookaburra/gears')

const def = () => true
def.break = query => query.criteria === undefined

const array = query => {
  if (Array.isArray(query.criteria)) {
    query.criteria = { properties: Object.fromEntries(query.criteria.map(name => [name, null])) }
  }
}

const id = (query, manifest) => {
  if (query.criteria.$id === undefined) {
    query.criteria.$id = `schema://${concat(manifest.domain, '/')}/${manifest.name}/query.criteria`
  }
}

const propertiesArray = query => {
  if (Array.isArray(query.criteria.properties)) {
    query.criteria.properties = Object.fromEntries(query.criteria.properties.map(name => [name, null]))
  }
}

exports.checks = [def, array, id, propertiesArray]
