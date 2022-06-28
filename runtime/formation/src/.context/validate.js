'use strict'

const { resolve } = require('node:path')

const { load } = require('@toa.io/libraries/yaml')
const { Schema } = require('@toa.io/libraries/schema')

const path = resolve(__dirname, 'schema.yaml')
const object = load.sync(path)
const schema = new Schema(object)

/**
 * @param {toa.formation.context.Declaration} context
 */
const validate = (context) => {
  schema.validate(context)
}

exports.validate = validate
