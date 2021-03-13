'use strict'

const path = require('path')

const { validation } = require('../../validation')

const def = (operation) => {
  if (operation.output === undefined) { operation.output = null }
}

def.break = (operation) => operation.output === null

const schema = async (operation, manifest) =>
  await validation(path.resolve(__dirname, '../../schema'))(operation.output, manifest, `${operation.name}.output`)

exports.checks = [def, schema]
