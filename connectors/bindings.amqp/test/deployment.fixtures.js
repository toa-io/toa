'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')
const { Locator } = require('@toa.io/core')

/** @type {toa.norm.context.dependencies.Instance[]} */
const instances = []

/**
 * @returns {toa.norm.context.dependencies.Instance}
 */
const instance = () => {
  const domain = generate()
  const name = generate()
  const locator = new Locator(domain, name)

  return { locator }
}

for (let i = 0; i < random(5) + 5; i++) instances.push(instance())

exports.instances = instances
