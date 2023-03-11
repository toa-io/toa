'use strict'

const { is } = require('../')

it('should be', async () => {
  expect(is).toBeDefined()
})

it('should validate', async () => {
  const ok = { type: 'string' }
  const oh = { type: 'fruit' }

  expect(is(ok)).toStrictEqual(true)
  expect(is(oh)).toStrictEqual(false)
})
