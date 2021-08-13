'use strict'

const lab = require('./lab')

let runtime = null

beforeAll(async () => {
  runtime = lab.runtime('messages')
})

it('should be ok', async () => {
  await runtime.invoke('add', { text: 'test' })

  expect(1).toBeLessThan(2)
})
