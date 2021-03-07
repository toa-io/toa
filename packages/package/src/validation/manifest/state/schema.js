'use strict'

const path = require('path')

const { yaml } = require('@kookaburra/gears')
const { validation } = require('../../validation')

const defined = () => true
defined.break = (state) => state.schema === undefined

const schema = async (state, manifest) => await validation(path.resolve(__dirname, './schema'))(state.schema, manifest)

let system
const add = async (state) => {
  if (!system) { system = await yaml(path.resolve(__dirname, '../../schemas/system.yaml')) }

  state.schema = {
    properties: { ...system.properties, ...state.schema.properties },
    required: system.required.concat(state.schema.required || [])
  }
}

exports.checks = [defined, schema, add]
