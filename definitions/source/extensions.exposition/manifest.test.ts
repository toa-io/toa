import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { type Manifest } from '@toa.io/norm'
import { generate } from 'randomstring'
import { manifest } from './manifest.ts'

const name = 'cm-' + generate()
const namespace = 'ns' + generate()

let mf: Manifest

const operations = { observe: {} }

beforeEach(() => {
  mf = { namespace, name, operations } as unknown as Manifest
})

const declaration = {
  '/': { GET: 'observe' }
}

it('should create branch', async () => {
  const node = manifest(declaration, mf)

  assert.notStrictEqual(node, undefined)
  assert.strictEqual(node.routes.length, 1)
  assert.strictEqual(node.routes[0].path, '/' + namespace + '/' + name)
})

it('should not create node for default namespace', async () => {
  mf.namespace = 'default'

  const node = manifest(declaration, mf)

  assert.strictEqual(node.routes.length, 1)
  assert.strictEqual(node.routes[0].path, '/' + name)
})

it('should throw on invalid declaration type', async () => {
  assert.throws(
    () => manifest('hello' as unknown as object, mf),
    (error: any) => /Exposition declaration must be an object/.test(error.message)
  )
})

// a projection is what a storage reads, and a read an operation writes back reads the record whole
it('should refuse a projection declared for an operation that is not an observation', async () => {
  mf.operations = { observe: { type: 'observation' }, transit: { type: 'transition' } } as any

  const projecting = {
    '/': { POST: { endpoint: 'transit', query: { projection: ['title'] } } }
  }

  assert.throws(
    () => manifest(projecting, mf),
    (error: any) => /declares a projection, which an operation of type 'transition'/.test(error.message)
  )
})

it('should refuse a projection that names id', async () => {
  mf.operations = { observe: { type: 'observation' } } as any

  const projecting = {
    '/': { GET: { endpoint: 'observe', query: { projection: ['id', 'title'] } } }
  }

  assert.throws(
    () => manifest(projecting, mf),
    (error: any) => /names 'id', which is always read/.test(error.message)
  )
})

it('should take a projection of an observation', async () => {
  mf.operations = { observe: { type: 'observation' } } as any

  const projecting = {
    '/': { GET: { endpoint: 'observe', query: { projection: ['title'] } } }
  }

  const node = manifest(projecting, mf)
  const GET = node.routes[0].node.routes[0].node.methods[0]

  assert.deepStrictEqual(GET.mapping?.query?.projection, ['title'])
})

it('should set namespace and component', async () => {
  const node = manifest(declaration, mf)

  const root = node.routes[0].node
  const intemediate = root.routes[0].node
  const GET = intemediate.methods[0]

  assert.strictEqual(GET.mapping?.namespace, namespace)
  assert.strictEqual(GET.mapping?.component, name)
})
