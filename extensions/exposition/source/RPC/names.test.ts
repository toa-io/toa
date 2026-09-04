import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as http from '../HTTP/index.js'
import { address } from './names.js'

describe('address', () => {
  it('should resolve a name without variables', () => {
    assert.deepEqual(address('pots#GET', {}),
      { path: '/pots/', verb: 'GET', variables: [] })
  })

  it('should resolve the trunk', () => {
    assert.deepEqual(address('#GET', {}),
      { path: '/', verb: 'GET', variables: [] })
  })

  it('should substitute a variable and report it taken', () => {
    assert.deepEqual(address('pots/:id#GET', { id: 'a1b2', title: 'Kettle' }),
      { path: '/pots/a1b2/', verb: 'GET', variables: ['id'] })
  })

  it('should substitute every variable', () => {
    assert.deepEqual(address('users/:user/pots/:id#PATCH', { user: 'bob', id: 'a1b2' }),
      { path: '/users/bob/pots/a1b2/', verb: 'PATCH', variables: ['user', 'id'] })
  })

  it('should let a tail carry separators', () => {
    assert.deepEqual(address('files/**#GET', { '**': 'a/b/c' }),
      { path: '/files/a/b/c/', verb: 'GET', variables: ['**'] })
  })

  it('should not confuse a trailing literal with a verb', () => {
    assert.deepEqual(address('pots/get#GET', {}),
      { path: '/pots/get/', verb: 'GET', variables: [] })
  })

  it('should refuse a name that states no verb', () => {
    assert.throws(() => address('pots/:id', { id: 'a1b2' }), http.NotFound)
  })

  it('should refuse a verb no method uses', () => {
    assert.throws(() => address('pots#FETCH', {}), http.NotFound)
  })

  it('should refuse an anonymous wildcard, which names nothing to substitute', () => {
    assert.throws(() => address('pots/*#GET', {}), http.NotFound)
  })

  it('should refuse a missing variable', () => {
    assert.throws(() => address('pots/:id#GET', {}), http.BadRequest)
  })

  it('should refuse a variable that would divide the path', () => {
    assert.throws(() => address('pots/:id#GET', { id: 'a/b' }), http.BadRequest)
    assert.throws(() => address('pots/:id#GET', { id: 'a?b' }), http.BadRequest)
    assert.throws(() => address('pots/:id#GET', { id: 'a#b' }), http.BadRequest)
  })

  it('should refuse a tail that would end the path', () => {
    assert.throws(() => address('files/**#GET', { '**': 'a?b' }), http.BadRequest)
  })
})
