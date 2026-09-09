import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { converge } from '../../src/.context/index.js'

const REFERENCE = '@toa.io/extensions.convergence'

/** @type {object} */
let context

/** @type {object[]} */
let components

const component = (id, properties = {}) => ({ id, entity: {}, ...properties })

beforeEach(() => {
  context = { annotations: { [REFERENCE]: { priority: 0 } } }

  components = [
    component('store.orders'),
    // what an extension ships reaches a deployment the same way and converges the same way:
    // an application whose identity does not converge has no users in its second region
    component('identity.basic'),
    component('exposition.octets', { entity: undefined })
  ]
})

it('should give the extension to every component that stores anything', () => {
  converge(context, components)

  assert.deepEqual(components[0].extensions, { [REFERENCE]: null })
  assert.deepEqual(components[1].extensions, { [REFERENCE]: null })
})

it('should leave a component that stores nothing alone', () => {
  converge(context, components)

  assert.equal(components[2].extensions, undefined)
})

it('should do nothing where the context is not a region', () => {
  delete context.annotations

  converge(context, components)

  for (const one of components) assert.equal(one.extensions, undefined)
})

it('should leave what a manifest declared as it was', () => {
  const declaration = { some: 'declaration' }

  components[0].extensions = { [REFERENCE]: declaration }

  converge(context, components)

  assert.equal(components[0].extensions[REFERENCE], declaration)
})
