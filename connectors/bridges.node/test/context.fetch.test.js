import { it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { fetch } from '../src/shortcuts/fetch.js'

it('exposes the fetch aspect as context.fetch', async () => {
  const response = new Response('ok')
  const aspect = { invoke: mock.fn(async () => response) }
  const context = { operation: 'get' }

  fetch(context, aspect)

  const init = { method: 'POST', retry: { attempts: 2 } }
  const result = await context.fetch('https://example.com', init)

  assert.strictEqual(result, response)
  assert.ok(aspect.invoke.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], 'get') && isDeepStrictEqual(call.arguments[1], 'https://example.com') && isDeepStrictEqual(call.arguments[2], init)))
})
