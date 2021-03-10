'use strict'

const path = require('path')

const { validation } = require('../../validation')

const def = (operation, manifest) => {
  if (operation.query === undefined && manifest.entity !== undefined) { operation.query = {} }
}

const entity = (operation, manifest) => operation.query === undefined || manifest.entity !== undefined
entity.message = 'operation query defined while component has no entity'
entity.fatal = false

const undef = () => true
undef.break = (operation) => operation.query === undefined

const criteria = async (operation, manifest) =>
  await validation(path.resolve(__dirname, './query'))(operation.query, manifest)

exports.checks = [def, entity, undef, criteria]
