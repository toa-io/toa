'use strict'

const { fetch } = require('../src/shortcuts/fetch')

it('exposes the fetch aspect as context.fetch', async () => {
  const response = new Response('ok')
  const aspect = { invoke: jest.fn(async () => response) }
  const context = { operation: 'get' }

  fetch(context, aspect)

  const init = { method: 'POST', retry: { attempts: 2 } }
  const result = await context.fetch('https://example.com', init)

  expect(result).toBe(response)
  expect(aspect.invoke).toHaveBeenCalledWith('get', 'https://example.com', init)
})
