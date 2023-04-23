'use strict'

const path = require('path')

const schemas = require('@toa.io/schemas')
const { load } = require('@toa.io/yaml')

const cos = load.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = schemas.schema(cos)

const validate = (declaration) => {
  const error = schema.fit(declaration)

  if (error) throw new TypeError(error.message)
}

exports.validate = validate
