'use strict'

const { resolve } = require('path')
const { yaml } = require('@toa.io/gears')

const definitions = (validator) => {
  const definitions = yaml.sync(resolve(__dirname, './definitions.yaml'))

  validator.addSchema(definitions)
}

exports.definitions = definitions
