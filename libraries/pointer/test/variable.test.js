'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { random, letters: { up } } = require('@toa.io/libraries/generic')

const { variable } = require('../')

it('should be', () => {
  expect(variable).toBeInstanceOf(Function)
})

it('should create variable', () => {
  const prefix = 'foo-bar'
  const namespace = generate()
  const component = generate()
  const locator = new Locator(component, namespace)
  const name = generate()

  let value = generate()

  const string = variable(prefix, locator, name, value)

  const expected = {
    name: `TOA_${up(prefix)}_${locator.uppercase}_${up(name)}`,
    value
  }

  expect(string).toStrictEqual(expected)

  value = random()
  expected.value = value

  const number = variable(prefix, locator, name, value)

  expect(number).toStrictEqual(expected)
})
