'use strict'

const { generate } = require('randomstring')

const { Locator } = require('@toa.io/core')
const { random } = require('@toa.io/libraries/generic')

const component = () => {
  const domain = generate()
  const name = generate()

  return { locator: new Locator({ domain, name }) }
}

/** @type {toa.formation.component.Brief[]} */
const components = []
const annotations = {}

const annotate = (component) => {
  const key = component.locator.id

  annotations[key] = { [generate()]: generate() }
}

for (let i = 0; i < random(10) + 5; i++) components.push(component())
for (let i = 0; i < components.length; i++) if (i % 2 === 0) annotate(components[i])

/**
 * @param {string} id
 * @returns {toa.formation.component.Brief}
 */
const find = (id) => {
  return components.find((component) => component.locator.id === id)
}

exports.components = components
exports.annotations = annotations
exports.find = find
