'use strict'

const { resolve } = require('path')
const { load } = require('@toa.io/yaml')

const definitions = (validator) => {
  const definitions = load.sync(resolve(__dirname, './definitions.yaml'))

  validator.addSchema(definitions)
}

exports.definitions = definitions
