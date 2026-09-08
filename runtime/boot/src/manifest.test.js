import { it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { generate } from 'randomstring'

const NORMALIZED = 'manifest.toa.json'

let normalised = 0

const digest = { labels: ['identity-basic'], manifests: [{ name: 'basic', namespace: 'identity' }] }

mock.module('@toa.io/norm', {
  namedExports: {
    component: () => {
      normalised++

      return mockComponent()
    },
    definition: async (reference) => ({
      module: reference === '@toa.io/extensions.exposition' ? { components: () => digest } : {}
    }),
    revive: (declared, path) => ({ ...declared, path }),
    NORMALIZED
  }
})

const { manifest } = await import('./manifest.js')

const path = generate()

it('should not modify options', async () => {
  const options = { extensions: ['foo', 'bar'] }

  await manifest(path, options)

  assert.deepStrictEqual(options.extensions.length, 2)
})

it('should normalize a component the build did not', async () => {
  const before = normalised

  await manifest(path)

  assert.strictEqual(normalised, before + 1)
})

it('should read what the build wrote, and not normalize', async () => {
  const root = await mkdtemp(join(tmpdir(), 'toa-manifest-test'))
  const declared = { name: 'tasks', namespace: 'todos', operations: { compute: {} } }

  await writeFile(join(root, NORMALIZED), JSON.stringify(declared))

  const before = normalised
  const read = await manifest(root)

  assert.strictEqual(normalised, before, 'the component was normalized')
  assert.strictEqual(read.path, root)
  assert.deepStrictEqual(read.operations, declared.operations)
  assert.strictEqual(read.locator.id, 'todos.tasks')
})

it('should read the digest for a component an extension ships, and not normalize', async () => {
  const root = await mkdtemp(join(tmpdir(), 'toa-manifest-test'))
  const component = join(root, 'components', 'identity.basic')

  await mkdir(component, { recursive: true })
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({ name: '@toa.io/extensions.exposition' })
  )

  const before = normalised
  const read = await manifest(component)

  assert.strictEqual(normalised, before, 'the component was normalized')
  assert.strictEqual(read.path, component)
  assert.strictEqual(read.locator.id, 'identity.basic')
})

it('should normalize a component that only looks like one an extension ships', async () => {
  const root = await mkdtemp(join(tmpdir(), 'toa-manifest-test'))
  const component = join(root, 'components', 'identity.basic')

  await mkdir(component, { recursive: true })
  // an application's own package, which the digest knows nothing about
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'acme' }))

  const before = normalised

  await manifest(component)

  assert.strictEqual(normalised, before + 1)
})

function mockComponent() {
  return { name: generate(), namespace: generate() }
}
