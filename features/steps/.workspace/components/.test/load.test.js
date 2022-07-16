'use strict'

const { load } = require('../load')

it('should be', () => {
  expect(load).toBeDefined()
})

it('should load', async () => {
  const id = 'dummies.one'
  const component = await load(id)

  expect(component.locator.id).toStrictEqual(id)
})
