'use strict'

const path = require('path')

const clone = require('clone-deep')
const { yaml } = require('@kookaburra/gears')
const { validation } = require('../../../validation')

const template = yaml.sync(path.resolve(__dirname, '../../../schemas/query.yaml'))
const $id = validation(path.resolve(__dirname, '../../../schema/'), '0.$id.js')

const def = (operation, manifest) => {
  operation.schemas.query = clone(template)

  $id(operation.schemas.query, manifest, `${operation.name}.query`)
}

exports.checks = [def]
