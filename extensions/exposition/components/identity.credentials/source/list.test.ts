import { it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Computation } from './list.js'

it('aggregates only public credential properties', async () => {
  const operation = new Computation()
  const input = { authority: 'nex', identity: 'identity' }

  const context = {
    remote: {
      identity: {
        basic: {
          info: mock.fn(async () => ({ username: 'user@example.com' }))
        },
        federation: {
          list: mock.fn(async () => [{
            id: 'federation',
            iss: 'https://accounts.google.com',
            sub: 'secret-subject',
            CREATED: 1
          }])
        },
        passkeys: {
          list: mock.fn(async () => [{
            id: 'passkey',
            aid: 'aaguid',
            synced: true,
            label: 'Phone',
            CREATED: 2,
            key: 'public-key',
            counter: 10
          }])
        }
      }
    }
  }

  operation.mount(context)

  await assert.deepStrictEqual(await operation.execute(input), {
    basic: { username: 'user@example.com' },
    federation: [{ id: 'federation', iss: 'https://accounts.google.com', CREATED: 1 }],
    passkeys: [{ id: 'passkey', aid: 'aaguid', synced: true, label: 'Phone', CREATED: 2 }]
  })

  assert.ok(context.remote.identity.basic.info.mock.calls.some((call: any) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { input })))
  assert.ok(context.remote.identity.federation.list.mock.calls.some((call: any) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { input })))
  assert.ok(context.remote.identity.passkeys.list.mock.calls.some((call: any) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { input })))
})
