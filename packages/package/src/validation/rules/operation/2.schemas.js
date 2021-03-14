'use strict'

const path = require('path')

const { validation } = require('../../validation')

const defined = () => true
defined.break = (operation) => operation.query === undefined || operation.schemas !== undefined

const def = (operation) => {
  if (operation.schemas === undefined) operation.schemas = {}
}

const schemas = (operation, manifest) => validation(path.resolve(__dirname, './schemas'))(operation, manifest)

exports.checks = [defined, def, schemas]
