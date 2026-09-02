'use strict'

const { services } = require('./services')

const service = (extra = {}) => ({ group: 'group', name: 'group-one', version: '0', ...extra })

it('should leave a service without an ingress alone', () => {
  const list = [service()]

  services(list, {}, undefined, { hosts: ['api.dev'] })

  expect(list[0].ingress).toBeUndefined()
})

/*
 * A service declares only where it wants to land; the cluster-level plumbing
 * belongs to the context.
 */
it('should supply hosts, class and annotations from the context', () => {
  const list = [service({ port: 8002, ingress: { path: '/.introspection' } })]

  services(list, {}, undefined, { hosts: ['api.dev'], class: 'alb', annotations: { a: 'b' } })

  expect(list[0].ingress).toStrictEqual({
    path: '/.introspection',
    hosts: ['api.dev'],
    class: 'alb',
    annotations: { a: 'b' }
  })
})

it('should keep what the service declared itself', () => {
  const list = [service({ port: 8000, ingress: { path: '/', hosts: ['own.dev'] } })]

  services(list, {}, undefined, { hosts: ['api.dev'], class: 'alb' })

  expect(list[0].ingress.hosts).toStrictEqual(['own.dev'])
  expect(list[0].ingress.class).toStrictEqual('alb')
})

it('should ignore properties the service left undefined', () => {
  const list = [service({ port: 8000, ingress: { path: '/', class: undefined } })]

  services(list, {}, undefined, { hosts: ['api.dev'], class: 'alb' })

  expect(list[0].ingress.class).toStrictEqual('alb')
})

it('should reject an ingress with nowhere to land', () => {
  const list = [service({ port: 8002, ingress: { path: '/.introspection' } })]

  expect(() => services(list, {}, undefined, undefined))
    .toThrow("Service 'group-one' declares an ingress, but no hosts are defined")
})

it('should reject an ingress without a port', () => {
  const list = [service({ ingress: { path: '/.introspection' } })]

  expect(() => services(list, {}, undefined, { hosts: ['api.dev'] }))
    .toThrow("Service 'group-one' declares an ingress, but no port")
})

/*
 * Removing a service's own probe leaves it relying on the dependency's. If that one is
 * off too, the service would be reported ready before it can serve.
 */
it('should reject an exposed service left with no probe at all', () => {
  const list = [service({ port: 8000, ingress: { path: '/' } })]

  expect(() => services(list, {}, false, { hosts: ['api.dev'] }))
    .toThrow("Service 'group-one' would deploy without a readiness probe")
})

it('should allow a service that states it runs without a probe', () => {
  const list = [service({ port: 8000, ingress: { path: '/' }, probe: false })]

  services(list, {}, false, { hosts: ['api.dev'] })

  expect(list[0].probe).toBeUndefined()
})
