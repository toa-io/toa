'use strict'

const framework = require('./framework')

beforeAll(() => {
  framework.dev(true)
})

afterAll(() => {
  framework.dev(false)
})

it('should resolve relative extension', async () => {
  const compose = async () => {
    const composition = await framework.compose(['extended'])
    await composition.disconnect()
  }

  await expect(compose()).resolves.not.toThrow()
})
