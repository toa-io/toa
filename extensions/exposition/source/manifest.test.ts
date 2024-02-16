import { type Manifest } from '@toa.io/norm'
import { generate } from 'randomstring'
import { manifest } from './manifest'

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

  expect(node).toBeDefined()
  expect(node.routes).toHaveLength(1)
  expect(node.routes[0].path).toBe('/' + namespace + '/' + name)
})

it('should not create node for default namespace', async () => {
  mf.namespace = 'default'

  const node = manifest(declaration, mf)

  expect(node.routes).toHaveLength(1)
  expect(node.routes[0].path).toBe('/' + name)
})

it('should throw on invalid declaration type', async () => {
  expect(() => manifest('hello' as unknown as object, mf)).toThrow('Exposition declaration must be an object')
})

it('should set namespace and component', async () => {
  const node = manifest(declaration, mf)

  const root = node.routes[0].node
  const intemediate = root.routes[0].node
  const GET = intemediate.methods[0]

  expect(GET.mapping?.namespace).toBe(namespace)
  expect(GET.mapping?.component).toBe(name)
})
