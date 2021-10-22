'use strict'

const { underlay } = require('../src')

it('should underlay', () => {
  const instance = underlay((domain, name, endpoint, args) => ({ domain, name, endpoint, args }))

  const result = instance.dummies.a.transit(1)

  expect(result).toStrictEqual({
    domain: 'dummies',
    name: 'a',
    endpoint: 'transit',
    args: [1]
  })
})

it('should underlay async', async () => {
  const instance = underlay(async (domain, name, endpoint, args) => ({ domain, name, endpoint, args }))

  const result = await instance.dummies.a.transit('ok')

  expect(result).toStrictEqual({
    domain: 'dummies',
    name: 'a',
    endpoint: 'transit',
    args: ['ok']
  })
})
