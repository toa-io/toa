'use strict'

const { resolve } = require('node:path')

const { readFileSync } = require('node:fs')
const { load: parseYAML } = require('js-yaml')
const schemas = require('@toa.io/schemas')

const path = resolve(__dirname, 'schema.yaml')
const object = parseYAML(readFileSync(path, 'utf8'))
const schema = schemas.schema(object)

const validate = (context) => {
  schema.validate(context)
}

exports.validate = validate
