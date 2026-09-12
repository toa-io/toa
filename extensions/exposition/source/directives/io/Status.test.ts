import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Status } from './Status.ts'
import { Output } from './Output.ts'
import type { Input as Context } from '../../io.ts'
import type { OutgoingMessage } from '../../HTTP/index.ts'

const status = new Status('status')

function context(): Context {
  return {
    pipelines: { body: [], response: [] },
    url: { pathname: '/' }
  } as unknown as Context
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

it('should take the status of a reply whatever that status is', () => {
  for (const stated of [200, 400]) {
    const response: OutgoingMessage = {
      body: { status: stated, code: 'SplxlO', error: 'invalid_grant' }
    }

    status.settle(context(), response)

    assert.equal(response.status, stated)
    assert.deepEqual(response.body, { code: 'SplxlO', error: 'invalid_grant' })
  }
})

it('should ask the operation for what it admits', () => {
  const ctx = context()

  new Output(['code', 'error']).precall(ctx, [])

  assert.deepEqual(ctx.output, ['code', 'error'])
})

it('should ask for the reply whole where it admits all of it', () => {
  const ctx = context()

  new Output(true).precall(ctx, [])

  assert.equal(ctx.output, undefined)
})

it('should ask for what a method and its node both admit', () => {
  const ctx = context()

  new Output(['id', 'code', 'error']).precall(ctx, [])
  new Output(['code', 'secret']).precall(ctx, [])

  assert.deepEqual(ctx.output, ['code'])
})
