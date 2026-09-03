import { it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { computation } from './list.js'

it('lists indexed credentials', async () => {
  const current = { id: 'credential', authority: 'nex', identity: 'identity', iss: 'apple', sub: '1', _created: 2 }

  const context = {
    local: {
      enumerate: mock.fn(async () => [current])
    }
  }

  await assert.deepStrictEqual(await computation({ authority: 'nex', identity: 'identity' }, context as never), [current])
  assert.ok(context.local.enumerate.mock.calls.some((call: any) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], {
    query: {
      criteria: 'authority=="nex";identity=="identity"',
      projection: ['iss'],
      sort: ['_created:desc'],
      limit: 100
    }
  })))
})
