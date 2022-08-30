'use strict'

const { stage } = require('../src/stage')

it('should be', () => {
  expect(stage).toBeDefined()
})

it('should reset', () => {
  const component = /** @type {toa.core.Component} */ 1
  const composition = /** @type {toa.core.Connector} */ 2
  const remote = /** @type {toa.core.Component} */ 3

  expect(stage.components.length).toStrictEqual(0)
  expect(stage.compositions.length).toStrictEqual(0)
  expect(stage.remotes.length).toStrictEqual(0)

  stage.components.push(component)
  stage.compositions.push(composition)
  stage.remotes.push(remote)

  stage.reset()

  expect(stage.components.length).toStrictEqual(0)
  expect(stage.compositions.length).toStrictEqual(0)
  expect(stage.remotes.length).toStrictEqual(0)
})
