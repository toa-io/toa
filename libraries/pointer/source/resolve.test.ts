import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { resolveRecord } from './resolve.ts'

const references = (value: string) => [value]

describe('a key of a map of addresses', () => {
  const uris = {
    '.': references('amqp://all'),
    default: references('amqp://default'),
    teapots: references('amqp://teapots'),
    dummies: references('amqp://dummies'),
    'dummies.one': references('amqp://one')
  }

  it('is the id of a component', () => {
    assert.equal(resolveRecord(uris, 'dummies.one').key, 'dummies.one')
  })

  it('is its namespace', () => {
    assert.equal(resolveRecord(uris, 'dummies.two').key, 'dummies')
  })

  it('is the name of a component that declares no namespace', () => {
    assert.equal(resolveRecord(uris, 'default.teapots').key, 'teapots')
  })

  it('is `default` for the rest of those', () => {
    assert.equal(resolveRecord(uris, 'default.kettles').key, 'default')
  })

  it('is the id of such a component before its name', () => {
    const both = { ...uris, 'default.teapots': references('amqp://qualified') }

    assert.equal(resolveRecord(both, 'default.teapots').key, 'default.teapots')
  })

  it('is `.` where nothing else matches', () => {
    assert.equal(resolveRecord(uris, 'what.ever').key, '.')
  })

  it('is refused where nothing matches at all', () => {
    assert.throws(() => resolveRecord({ dummies: references('amqp://dummies') }, 'what.ever'))
  })
})
