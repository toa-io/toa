'use strict'

const { resolve } = require('path')
const { yaml } = require('@kookaburra/gears')

const definitions = yaml.sync(resolve(__dirname, './definitions.yaml'))

module.exports = (validator) => {
  validator.addSchema(definitions)
}
