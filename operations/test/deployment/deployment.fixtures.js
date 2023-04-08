'use strict'

const { generate } = require('randomstring')

const context = /** @type {toa.norm.Context} */ { name: generate() }
const compositions = []
/** @type {toa.deployment.Dependency[]} */

const bindingVariables = {
  name: 'TOA_BINDINGS_AMQP_POINTER',
  value: 'eyJkZWZhdWx0IjoiYW1xcDovL3doYXRldmVyIiwic3lzdGVtIjoiYW1xcDovL2hvc3QwIn0='
}

const secretVariables = {
  name: 'TOA_BINDINGS_AMQP_DEFAULT_USERNAME',
  secret: {
    name: 'toa-bindings-amqp-default',
    key: 'username'
  }
}
const dependencies = [{
  variables: {
    global: [bindingVariables, secretVariables]
  }
}]
const process = /** @type {toa.operations.Process} */ { execute: jest.fn() }
const options = /** @type {toa.deployment.installation.Options} */ {
  namespace: generate(),
  target: generate()
}

exports.context = context
exports.compositions = compositions
exports.dependencies = dependencies
exports.process = process
exports.options = options
exports.bindingVariables = bindingVariables
exports.secretVariables = secretVariables
