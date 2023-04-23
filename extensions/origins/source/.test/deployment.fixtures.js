'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { random, sample } = require('@toa.io/generic')

const { PROTOCOLS } = require('./constants')

const component = () => ({
  locator: new Locator(generate(), generate()),
  manifest: { [generate()]: sample(PROTOCOLS) + '//' + generate() }
})

const components = () => {
  const length = random(20) + 10

  return Array.from({ length }, component)
}

exports.components = components
