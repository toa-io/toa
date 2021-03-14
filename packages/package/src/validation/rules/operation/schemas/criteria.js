'use strict'

const path = require('path')

const { validation } = require('../../../validation')

const $id = validation(path.resolve(__dirname, '../../../schema/'), '$id.js')

const defined = () => true
defined.break = (operation) => operation.schemas.criteria !== undefined

const criteria = () => true
criteria.break = (operation) => operation.query?.criteria === undefined || operation.query?.criteria === null

const map = (operation, manifest) => {
  const schema = { type: 'object', properties: {} }

  $id(schema, manifest, `${operation.name}.query.criteria`)

  schema.properties = Object.fromEntries(Object.entries(operation.query.criteria)
    .map(([name, extension]) =>
      [name, { $ref: `${manifest.entity.schema.$id}#/properties/${name}`, ...extension }]))

  operation.schemas.criteria = schema
}

exports.checks = [defined, criteria, map]
