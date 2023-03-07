'use strict'

const { immediate } = require('../')

it('should be', async () => {
  expect(immediate).toBeDefined()
})

it('should run immediately', async () => {
  let a = false
  let b = false

  const func = async () => {
    a = true

    await immediate()

    b = true
  }

  setImmediate(async () => {
    expect(a).toStrictEqual(true)
    expect(b).toStrictEqual(false)

    await immediate()

    expect(b).toStrictEqual(true)
  })

  await func()
})
