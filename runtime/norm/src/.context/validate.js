'use strict'

const { resolve } = require('node:path')

const { load } = require('@toa.io/yaml')
const schemas = require('@toa.io/schemas')

const path = resolve(__dirname, 'schema.yaml')
const object = load.sync(path)
const schema = schemas.schema(object)

const validate = (context) => {
  schema.validate(context)
}

exports.validate = validate
