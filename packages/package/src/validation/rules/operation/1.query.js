'use strict'

const path = require('path')
const { validation } = require('../../validation')

const exists = () => true
exists.break = (operation) => operation.query === undefined || operation.query === null

const expand = (operation) => {
  if (typeof operation.query === 'string' || Array.isArray(operation.query)) {
    operation.query = { criteria: operation.query }
  }
}

const query = (operation, manifest) =>
  validation(path.resolve(__dirname, './query'))(operation.query, operation, manifest)

exports.checks = [exists, expand, query]
