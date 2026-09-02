'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { services } = require('./services')

const service = (extra = {}) => ({ group: 'group', name: 'group-one', version: '0', ...extra })

it('should leave a service without an ingress alone', () => {
  const list = [service()]

  services(list, {}, undefined, { hosts: ['api.dev'] })

  assert.strictEqual(list[0].ingress, undefined)
})

/*
 * A service declares only where it wants to land; the cluster-level plumbing
 * belongs to the context.
 */
it('should supply hosts, class and annotations from the context', () => {
  const list = [service({ port: 8002, ingress: { path: '/.introspection' } })]

  services(list, {}, undefined, { hosts: ['api.dev'], class: 'alb', annotations: { a: 'b' } })

  assert.deepStrictEqual(list[0].ingress, {
    path: '/.introspection',
    hosts: ['api.dev'],
    class: 'alb',
    annotations: { a: 'b' }
  })
})

it('should keep what the service declared itself', () => {
  const list = [service({ port: 8000, ingress: { path: '/', hosts: ['own.dev'] } })]

  services(list, {}, undefined, { hosts: ['api.dev'], class: 'alb' })

  assert.deepStrictEqual(list[0].ingress.hosts, ['own.dev'])
  assert.deepStrictEqual(list[0].ingress.class, 'alb')
})

it('should ignore properties the service left undefined', () => {
  const list = [service({ port: 8000, ingress: { path: '/', class: undefined } })]

  services(list, {}, undefined, { hosts: ['api.dev'], class: 'alb' })

  assert.deepStrictEqual(list[0].ingress.class, 'alb')
})

it('should reject an ingress with nowhere to land', () => {
  const list = [service({ port: 8002, ingress: { path: '/.introspection' } })]

  assert.throws(() => services(list, {}, undefined, undefined), (error) => /Service 'group-one' declares an ingress, but no hosts are defined/.test(error.message))
})

it('should reject an ingress without a port', () => {
  const list = [service({ ingress: { path: '/.introspection' } })]

  assert.throws(() => services(list, {}, undefined, { hosts: ['api.dev'] }), (error) => /Service 'group-one' declares an ingress, but no port/.test(error.message))
})
