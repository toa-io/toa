'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { random } = require('@toa.io/libraries/generic')

const instance = () => {
  const name = generate()
  const namespace = generate()
  const locator = new Locator(name, namespace)

  const manifest = {
    properties: {
      foo: {
        type: 'number',
        default: 1
      }
    }
  }

  return { locator, manifest }
}

/** @type {toa.norm.context.dependencies.Instance[]} */
const instances = []

for (let i = 0; i < random(5) + 5; i++) instances.push(instance())

/** @type {Object} */
const annotation = {}

for (let i = 0; i < random(instances.length - 1) + 1; i++) {
  const instance = instances[i]
  annotation[instance.locator.id] = { foo: random() }
}

exports.instances = instances
exports.annotation = annotation
