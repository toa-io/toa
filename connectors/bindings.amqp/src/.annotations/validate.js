'use strict'

const path = require('path')

const { Schema } = require('@toa.io/schema')
const { yaml } = require('@toa.io/gears')

const schema = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const validator = new Schema(schema)

const validate = (declaration) => {
  const error = validator.fit(declaration)

  if (error) throw new TypeError(error.message)
}

exports.validate = validate
