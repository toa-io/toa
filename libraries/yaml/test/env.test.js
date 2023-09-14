'use strict'

const path = require('node:path')
const { load } = require('../')

it('should substitute env variable', async () => {
  process.env.TEST_VAR = 'two'

  const object = await load(path.resolve(__dirname, './examples/env.yaml'))

  expect(object).toStrictEqual({ one: 'two' })

  delete process.env.TEST_VAR
})

it('should throw if env var is not defined', async () => {
  await expect(load(path.resolve(__dirname, './examples/env.yaml'))).rejects.toThrow('TEST_VAR is not defined')
})
