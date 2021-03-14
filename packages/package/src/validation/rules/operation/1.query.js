'use strict'

const path = require('path')
const { validation } = require('../../validation')

const entityWithoutQuery = (operation, manifest) => operation.query !== undefined || manifest.entity === undefined
entityWithoutQuery.fatal = false
entityWithoutQuery.message = (operation) =>
  `operation '${operation.name}' query is not defined. If this is intended use null as query value.`

const queryWithoutEntity = (operation, manifest) => operation.query === undefined || manifest.entity !== undefined
queryWithoutEntity.fatal = true
queryWithoutEntity.message = (operation) => `operation '${operation.name}' query is defined while component has no entity`

const exists = () => true
exists.break = (operation) => operation.query === undefined || operation.query === null

const expand = (operation) => {
  if (typeof operation.query === 'string' || Array.isArray(operation.query)) {
    operation.query = { criteria: operation.query }
  }
}

const query = (operation, manifest) =>
  validation(path.resolve(__dirname, './query'))(operation.query, operation, manifest)

exports.checks = [entityWithoutQuery, queryWithoutEntity, exists, expand, query]
