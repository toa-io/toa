import { type Manifest } from '@toa.io/norm'
import { generate } from 'randomstring'
import { manifest } from './manifest'

const name = 'cm-' + generate()
const namespace = 'ns' + generate()

let mf: Manifest

beforeEach(() => {
  mf = { namespace, name } as unknown as Manifest
})

const declaration = {
  '/': { GET: 'observe' }
}

it('should create branch', async () => {
  const node = manifest(declaration, mf)

  expect(node).toBeDefined()

  // namespace route
  expect(node.routes).toHaveLength(1)
  expect(node.routes[0].path).toBe('/' + namespace)

  const ns = node.routes[0].node

  // component route
  expect(ns.routes).toHaveLength(1)
  expect(ns.routes[0].path).toBe('/' + name)
})

it('should not create node for default namespace', async () => {
  mf.namespace = 'default'

  const node = manifest(declaration, mf)

  expect(node.routes).toHaveLength(1)
  expect(node.routes[0].path).toBe('/' + name)
})

it('should throw on invalid declaration type', async () => {
  expect(() => manifest('hello' as unknown as object, mf)).toThrow('RTD parse error')
})

it('should set namespace and component', async () => {
  const node = manifest(declaration, mf)

  const ns = node.routes[0].node
  const cm = ns.routes[0].node
  const root = cm.routes[0].node
  const GET = root.methods[0]

  expect(GET.mapping?.namespace).toBe(namespace)
  expect(GET.mapping?.component).toBe(name)
})
