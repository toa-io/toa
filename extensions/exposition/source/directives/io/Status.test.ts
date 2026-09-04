import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Status } from './Status.js'
import { Output } from './Output.js'
import type { Input as Context } from '../../io.js'
import type { OutgoingMessage } from '../../HTTP/index.js'

const status = new Status('status')

function context (): Context {
  return { pipelines: { body: [], response: [] }, url: { pathname: '/' } } as unknown as Context
}

it('should take the status from the property and remove it', () => {
  const response: OutgoingMessage = { body: { status: 400, error: 'invalid_request' } }

  status.settle(context(), response)

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, { error: 'invalid_request' })
})

it('should leave a reply that states no status alone', () => {
  const response: OutgoingMessage = { body: { id: 'x' } }

  status.settle(context(), response)

  assert.equal(response.status, undefined)
  assert.deepEqual(response.body, { id: 'x' })
})

it('should refuse a status that is not one', () => {
  for (const value of ['400', null, {}, true])
    assert.throws(() => {
      status.settle(context(), { body: { status: value } } as OutgoingMessage)
    }, /`io:status` expects 'status' to be a number/)
})

it('should refuse a declaration that is not a property name', () => {
  for (const value of [1, null, {}, ['status']])
    assert.throws(() => Status.validate(value), /`io:status` must be a string/)
})

it('should have a reply it named the status of restricted, whatever that status is', () => {
  for (const stated of [200, 400]) {
    const ctx = context()
    const output = new Output(['code', 'error'])

    output.preflight(ctx, [])

    const response: OutgoingMessage = {
      body: { status: stated, code: 'SplxlO', error: 'invalid_grant', secret: 'x' }
    }

    status.settle(ctx, response)

    for (const transform of ctx.pipelines.response)
      transform(response)

    assert.equal(response.status, stated)
    assert.deepEqual(response.body, { code: 'SplxlO', error: 'invalid_grant' })
  }
})

it('should leave a failure the gateway built alone, on such a route too', () => {
  const ctx = context()
  const output = new Output(['code'])

  output.preflight(ctx, [])

  // what `Server.fail` builds out of an exception, on a route that also declares `io:status`
  const response: OutgoingMessage = {
    status: 422,
    authentic: true,
    body: { code: 'NOT_FOUND', message: 'nope' }
  }

  for (const transform of ctx.pipelines.response)
    transform(response)

  assert.deepEqual(response.body, { code: 'NOT_FOUND', message: 'nope' },
    'a code and a message are not what a restriction has anything to say about')
})
