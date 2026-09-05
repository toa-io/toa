import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as http from '../HTTP/index.js'
import { segment } from '../RTD/segment.js'
import { address, name, refusal } from './names.js'

describe('address', () => {
  it('should resolve a name without variables', () => {
    assert.deepEqual(address('pots.GET', {}),
      { path: '/pots/', verb: 'GET', variables: [] })
  })

  it('should resolve the trunk', () => {
    assert.deepEqual(address('GET', {}),
      { path: '/', verb: 'GET', variables: [] })
  })

  it('should substitute a variable and report it taken', () => {
    assert.deepEqual(address('pots._id.GET', { id: 'a1b2', title: 'Kettle' }),
      { path: '/pots/a1b2/', verb: 'GET', variables: ['id'] })
  })

  it('should substitute every variable', () => {
    assert.deepEqual(address('users._user.pots._id.PATCH', { user: 'bob', id: 'a1b2' }),
      { path: '/users/bob/pots/a1b2/', verb: 'PATCH', variables: ['user', 'id'] })
  })

  it('should let a tail carry separators', () => {
    assert.deepEqual(address('files.__.GET', { '**': 'a/b/c' }),
      { path: '/files/a/b/c/', verb: 'GET', variables: ['**'] })
  })

  it('should not confuse a trailing literal with a verb', () => {
    assert.deepEqual(address('pots.GET.POST', {}),
      { path: '/pots/GET/', verb: 'POST', variables: [] })
  })

  it('should refuse a name that states no verb', () => {
    assert.throws(() => address('pots._id', { id: 'a1b2' }), http.NotFound)
  })

  it('should refuse a verb no method uses', () => {
    assert.throws(() => address('pots.FETCH', {}), http.NotFound)
  })

  it('should refuse a segment no name can spell', () => {
    assert.throws(() => address('pots/v1.GET', {}), http.NotFound)
    assert.throws(() => address('a_b.GET', {}), http.NotFound)
    assert.throws(() => address('pots..GET', {}), http.NotFound)
  })

  it('should refuse a variable of no name', () => {
    assert.throws(() => address('pots._.GET', { '': 'a1b2' }), http.NotFound)
  })

  it('should refuse a missing variable', () => {
    assert.throws(() => address('pots._id.GET', {}), http.BadRequest)
  })

  it('should refuse a variable that would divide the path', () => {
    assert.throws(() => address('pots._id.GET', { id: 'a/b' }), http.BadRequest)
    assert.throws(() => address('pots._id.GET', { id: 'a?b' }), http.BadRequest)
    assert.throws(() => address('pots._id.GET', { id: 'a#b' }), http.BadRequest)
  })

  it('should refuse a tail that would end the path', () => {
    assert.throws(() => address('files.__.GET', { '**': 'a?b' }), http.BadRequest)
  })
})

describe('name', () => {
  it('should name the trunk by its verb alone', () => {
    assert.equal(name(segment('/'), 'GET'), 'GET')
  })

  it('should name a route', () => {
    assert.equal(name(segment('/pots'), 'GET'), 'pots.GET')
    assert.equal(name(segment('/identity/tokens'), 'POST'), 'identity.tokens.POST')
  })

  it('should mark a variable', () => {
    assert.equal(name(segment('/pots/:id'), 'GET'), 'pots._id.GET')
    assert.equal(name(segment('/identity/tokens/:identity'), 'POST'),
      'identity.tokens._identity.POST')
  })

  it('should mark a tail', () => {
    assert.equal(name(segment('/files/**'), 'GET'), 'files.__.GET')
  })

  it('should keep a hyphen', () => {
    assert.equal(name(segment('/jpeg-or-png'), 'GET'), 'jpeg-or-png.GET')
  })

  it('should name nothing where a segment cannot be spelled', () => {
    assert.equal(name(segment('/v1.0/pots'), 'GET'), null)
    assert.equal(name(segment('/a_b'), 'GET'), null)
    assert.equal(name(segment('/pots/*'), 'GET'), null)
    assert.equal(name(segment('/messages/:sender-:recipient'), 'GET'), null)
  })

  it('should round-trip what it names', () => {
    const named = name(segment('/pots/:id'), 'GET')!

    assert.deepEqual(address(named, { id: 'a1b2' }),
      { path: '/pots/a1b2/', verb: 'GET', variables: ['id'] })
  })
})

describe('refusal', () => {
  it('should name nothing where every segment can be spelled', () => {
    assert.equal(refusal(segment('/pots/:id')), null)
  })

  it('should name the segment as it was declared', () => {
    assert.equal(refusal(segment('/v1.0/pots')), 'v1.0')
    assert.equal(refusal(segment('/pots/a_b')), 'a_b')
    assert.equal(refusal(segment('/pots/*')), '*')
    assert.equal(refusal(segment('/messages/:sender-:recipient')), ':sender-:recipient')
  })
})
