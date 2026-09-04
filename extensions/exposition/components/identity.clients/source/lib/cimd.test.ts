import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { read } from './cimd.js'
import type { Context } from './Context.js'

const ID = 'https://claude.ai/oauth/claude-code-client-metadata'

const document = {
  client_id: ID,
  client_name: 'Claude Code',
  redirect_uris: ['http://localhost/callback', 'http://127.0.0.1/callback']
}

let context: Context
let fetched: string[]
let stored: Record<string, string>

function respond (body: unknown, ok = true): Response {
  return {
    ok,
    text: async () => JSON.stringify(body)
  } as unknown as Response
}

beforeEach(() => {
  fetched = []
  stored = {}

  context = {
    configuration: {
      trust: ['https://claude.ai'],
      lifetime: 3600,
      ttl: 2592000,
      size: 16384,
      timeout: 3000
    },
    stash: {
      get: mock.fn(async (key: string) => stored[key] ?? null),
      set: mock.fn(async (key: string, value: string) => {
        stored[key] = value
      })
    },
    fetch: mock.fn(async (input: string) => {
      fetched.push(input)

      return respond(document)
    }),
    logs: { debug: mock.fn() }
  } as unknown as Context
})

it('should read what the client publishes', async () => {
  const client = await read(ID, context)

  assert.deepEqual(client, {
    client_id: ID,
    client_name: 'Claude Code',
    client_uri: undefined,
    logo_uri: undefined,
    redirect_uris: document.redirect_uris
  })
})

it('should hold it, rather than read it per request', async () => {
  await read(ID, context)
  await read(ID, context)

  assert.equal(fetched.length, 1)
})

it('should not reach an origin the configuration does not name', async () => {
  const client = await read('https://evil.example/metadata', context)

  assert.ok(client instanceof Error)
  assert.equal(fetched.length, 0, 'an untrusted origin must not be fetched at all')
})

it('should not reach a host that merely starts like a trusted one', async () => {
  const client = await read('https://claude.ai.evil.example/metadata', context)

  assert.ok(client instanceof Error)
  assert.equal(fetched.length, 0)
})

it('should refuse anything but https', async () => {
  for (const id of ['http://claude.ai/metadata', 'file:///etc/passwd', 'not a url']) {
    const client = await read(id, context)

    assert.ok(client instanceof Error, id)
  }

  assert.equal(fetched.length, 0)
})

it('should refuse a document that names another client', async () => {
  context.fetch = mock.fn(async () => respond({ ...document, client_id: 'https://claude.ai/other' }))

  assert.ok(await read(ID, context) instanceof Error)
})

it('should refuse a document with no redirect to send a code to', async () => {
  context.fetch = mock.fn(async () => respond({ client_id: ID, redirect_uris: [] }))

  assert.ok(await read(ID, context) instanceof Error)
})

it('should remember that a document did not answer', async () => {
  let calls = 0

  context.fetch = mock.fn(async () => {
    calls++

    return respond({}, false)
  })

  assert.ok(await read(ID, context) instanceof Error)
  assert.ok(await read(ID, context) instanceof Error)
  assert.equal(calls, 1, 'a document that failed must not be refetched per request')
})
