'use strict'

const path = require('path')

const { Schema } = require('@toa.io/schema')
const { load } = require('@toa.io/yaml')

const schema = load.sync(path.resolve(__dirname, 'schema.yaml'))
const validator = new Schema(schema)

const validate = (declaration) => validator.validate(declaration)

exports.validate = validate
