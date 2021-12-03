'use strict'

const path = require('node:path')

const { yaml } = require('@toa.io/gears')
const { Schema } = require('@toa.io/schema')

const object = yaml.sync(path.resolve(__dirname, 'schema.yaml'))
const schema = new Schema(object)

const validate = (context) => {
  const error = schema.fit(context)

  if (error) throw new Error(error.message)
}

exports.validate = validate
