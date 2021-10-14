'use strict'

const path = require('path')

const { Schema } = require('@kookaburra/schema')
const { yaml } = require('@kookaburra/gears')

const schema = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const validator = new Schema(schema)

const validate = (definition) => {
  const error = validator.fit(definition)

  if (error) throw new Error(error.message)
}

exports.validate = validate
