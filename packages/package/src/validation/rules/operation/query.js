'use strict'

const def = (operation, manifest) => {
  if (operation.query === undefined && manifest.entity !== undefined) { operation.query = {} }
}

const entity = (operation, manifest) => operation.query === undefined || manifest.entity !== undefined
entity.message = 'operation query defined while component has no entity'
entity.fatal = false

const undef = () => true
undef.break = (operation) => operation.query === undefined

const criteria = (operation, manifest) => {
  if (operation.query.criteria === undefined) {
    operation.query.criteria = { properties: { ...manifest.entity.schema.properties } }
  }
}

exports.checks = [def, entity, undef, criteria]
