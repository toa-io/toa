'use strict'

const path = require('path')
const { yaml } = require('@kookaburra/gears')
const { Schema } = require('@kookaburra/schema')

const object = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = new Schema(object)

const validate = (object) => {
  const error = schema.fit(object)

  if (error) throw new Error(error.message)
}

exports.validate = validate
