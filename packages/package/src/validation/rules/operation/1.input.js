'use strict'

const path = require('path')

const { validation } = require('../../validation')

const def = (operation) => {
  if (operation.input === undefined) { operation.input = null }
}

def.break = (operation) => operation.input === null

const schema = async (operation, manifest) =>
  await validation(path.resolve(__dirname, '../../../schema'))(operation.input, manifest, `${operation.name}.input`)

exports.checks = [def, schema]
