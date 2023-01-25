'use strict'

const { resolve } = require('node:path')
const { namespace } = require('@toa.io/libraries/schemas')
const yaml = require('@toa.io/libraries/yaml')

const load = (name) => {
  const path = resolve(__dirname, '.schemas', name + '.cos.yaml')

  return yaml.load.sync(path)
}

const names = ['operation', 'message']
const contents = names.map(load)
const schemas = namespace(contents)

exports.schemas = schemas
