import { it, beforeEach, afterEach, mock } from 'node:test'
import type { Mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Ready } from './Ready.js'

let send: Mock<any>
let original: typeof process.send

beforeEach(() => {
  original = process.send
  send = mock.fn()
  process.send = send as unknown as typeof process.send
})

afterEach(() => {
  process.send = original
})

it('should signal readiness', async () => {
  const ready = Ready.create()!

  await ready.connect()
  await ready.complete()

  assert.ok(
    send.mock.calls.some(
      (call: any) =>
        call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], 'ready')
    )
  )

  await ready.disconnect()
})

// pm2 `wait_ready` blocks until `listen_timeout` when a process never signals,
// and processes sharing a host share the probe port
it('should signal readiness when the probe port is taken', async () => {
  const first = Ready.create()!
  const second = Ready.create()!

  await first.connect()
  await second.connect()

  await second.complete()

  assert.ok(
    send.mock.calls.some(
      (call: any) =>
        call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], 'ready')
    )
  )

  await first.disconnect()
  await second.disconnect()
})

// a port of this suite's own: the conventional one is what an application binds, and a
// machine running one answers this probe with its own
const PORT = 31091
const PATH = '/.ready'

it('should answer a halted process as well, and say for how long', async () => {
  const ready = new Ready({ port: PORT, path: PATH })

  await ready.connect()
  await ready.complete()

  const url = `http://127.0.0.1:${PORT}${PATH}`

  let response = await fetch(url)

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-toa-halted'), null)

  // nothing must replace a halted process: it is well, it is only doing nothing
  ready.halted(60)

  response = await fetch(url)

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-toa-halted'), '60')

  ready.resumed()

  response = await fetch(url)

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-toa-halted'), null)

  await ready.disconnect()
})
