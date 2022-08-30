'use strict'

const { stage } = require('../src/stage')

it('should be', () => {
  expect(stage).toBeDefined()
})

it('should reset components', () => {
  const dummy = /** @type {toa.core.Component} */ { foo: 'bar' }

  expect(stage.components.length).toStrictEqual(0)

  stage.components.push(dummy)

  expect(stage.components.length).toStrictEqual(1)
  expect(stage.components[0]).toStrictEqual(dummy)

  stage.reset()

  expect(stage.components.length).toStrictEqual(0)
})
