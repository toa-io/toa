'use strict'

const { Locator } = require('@toa.io/core')
const { random } = require('@toa.io/generic')
const { generate } = require('randomstring')

const component = () => ({
  locator: new Locator(generate(), generate()),
  manifest: { [generate()]: 'http://' + generate() }
})

const components = () => {
  const length = random(5) + 5

  return Array.from({ length }, component)
}

exports.components = components
