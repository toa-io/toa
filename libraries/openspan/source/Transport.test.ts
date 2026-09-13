import { it, describe, before, after, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import * as http from 'node:http'
import { console } from './Console.ts'
import { Transport } from './Transport.ts'
import type { AddressInfo } from 'node:net'
import type { Socket } from 'node:net'

interface Received {
  body: string
  reused: boolean
}

let received: Received[] = []
let connections = 0

/** What the server does with a request, replaced per test. */
let behaviour: (request: http.IncomingMessage, response: http.ServerResponse) => void

let server: http.Server
let endpoint: string

const requests = new WeakMap<Socket, number>()

before(async () => {
  server = http.createServer((request, response) => {
    const socket = request.socket
    const count = (requests.get(socket) ?? 0) + 1

    requests.set(socket, count)

    let body = ''

    request.setEncoding('utf8')
    request.on('data', (chunk: string) => (body += chunk))
    request.on('end', () => received.push({ body, reused: count > 1 }))

    behaviour(request, response)
  })

  server.on('connection', () => connections++)

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

after(async () => {
  server.closeAllConnections()

  await new Promise<void>((resolve) => server.close(() => resolve()))
})

beforeEach(() => {
  received = []
  connections = 0
  server.keepAliveTimeout = 5000
  behaviour = (_, response) => response.writeHead(200).end()
})

afterEach(() => {
  mock.restoreAll()
})

function create(): Transport {
  return new Transport(endpoint, { subject: 'spans' })
}

/** Resets the connection whenever the request arrives on a socket that has already served one. */
function resetReused(): void {
  behaviour = (request, response) => {
    if ((requests.get(request.socket) ?? 0) > 1) request.socket.resetAndDestroy()
    else response.writeHead(200).end()
  }
}

describe('a reset keep-alive connection', () => {
  it('is retried once, and the export is not suspended', async () => {
    const warn = mock.method(console, 'warn', () => undefined)
    const transport = create()

    assert.equal(await transport.send('first'), true)

    resetReused()

    assert.equal(await transport.send('second'), true)
    assert.equal(transport.suspended, false)
    assert.equal(warn.mock.callCount(), 0)
  })

  it('is retried on a new connection, carrying the same body', async () => {
    mock.method(console, 'warn', () => undefined)

    const transport = create()

    await transport.send('first')

    resetReused()

    await transport.send('second')

    // the reset one, and the retry
    const attempts = received.filter((one) => one.body === 'second')

    assert.equal(attempts.length, 2)
    assert.equal(attempts[0].reused, true)
    assert.equal(attempts[1].reused, false)
    assert.equal(connections, 2)
  })

  it('is retried once only', async () => {
    const warn = mock.method(console, 'warn', () => undefined)
    const transport = create()

    await transport.send('first')

    // every request is reset from now on, the retry included
    behaviour = (request) => request.socket.resetAndDestroy()

    assert.equal(await transport.send('second'), false)
    assert.equal(transport.suspended, true)
    assert.equal(warn.mock.callCount(), 1)
  })
})

describe('a reset of a new connection', () => {
  it('suspends the export', async () => {
    const warn = mock.method(console, 'warn', () => undefined)
    const transport = create()

    behaviour = (request) => request.socket.resetAndDestroy()

    assert.equal(await transport.send('body'), false)
    assert.equal(transport.suspended, true)
    assert.equal(warn.mock.callCount(), 1)
    assert.equal(connections, 1)
  })
})

describe('an idle keep-alive connection closed by the endpoint', () => {
  it('does not suspend the export', async () => {
    const warn = mock.method(console, 'warn', () => undefined)

    server.keepAliveTimeout = 50

    const transport = create()

    assert.equal(await transport.send('first'), true)

    await new Promise((resolve) => setTimeout(resolve, 150))

    assert.equal(await transport.send('second'), true)
    assert.equal(transport.suspended, false)
    assert.equal(warn.mock.callCount(), 0)
  })
})
