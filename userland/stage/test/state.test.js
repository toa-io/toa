'use strict'

const { state } = require('../src/state')

it('should be', () => {
  expect(state).toBeDefined()
})

it('should reset', () => {
  const component = /** @type {toa.core.Component} */ 1
  const composition = /** @type {toa.core.Connector} */ 2
  const remote = /** @type {toa.core.Component} */ 3

  expect(state.components.length).toStrictEqual(0)
  expect(state.compositions.length).toStrictEqual(0)
  expect(state.remotes.length).toStrictEqual(0)

  state.components.push(component)
  state.compositions.push(composition)
  state.remotes.push(remote)

  state.reset()

  expect(state.components.length).toStrictEqual(0)
  expect(state.compositions.length).toStrictEqual(0)
  expect(state.remotes.length).toStrictEqual(0)
})
