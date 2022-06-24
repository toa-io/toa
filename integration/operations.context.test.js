'use strict'

const { newid } = require('@toa.io/libraries/generic')

const framework = require('./framework')

let composition, credits

beforeAll(async () => {
  composition = await framework.compose(['credits'])
  credits = await framework.remote('credits.balance')
})

afterAll(async () => {
  if (credits) await credits.disconnect()
  if (composition) await composition.disconnect()
})

it('should provide local', async () => {
  const from = newid()
  const to = newid()
  const reply = await credits.invoke('transfer', { input: from, query: { id: to } })

  expect(reply.output).toStrictEqual(20)
})
