import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'

import { component } from '../src/component.js'
import { plain, revive } from '../src/manifest.js'

/** the prototype itself: an entity, operations and events, and no prototype of its own */
const PROTOTYPE = resolve(import.meta.dirname, '../../prototype')

/** a component on the default prototype, with an entity, events and receivers */
const COMPONENT = resolve(
  import.meta.dirname,
  '../../../features/steps/.workspace/components/collection/external.consumer'
)

/** a component whose prototype is a directory of the workspace's own */
const EXTENDED = resolve(
  import.meta.dirname,
  '../../../features/steps/.workspace/components/collection/configuration.extended'
)

const carry = (manifest) => JSON.parse(JSON.stringify(plain(manifest)))

describe('a manifest carried through a file', () => {
  for (const [name, path] of [
    ['the prototype', PROTOTYPE],
    ['a component', COMPONENT]
  ])
    it(`comes back the same: ${name}`, async () => {
      const manifest = await component(path)

      assert.deepStrictEqual(revive(carry(manifest), path), manifest)
    })

  it('does not carry a key with no value', () => {
    const carried = plain({ name: 'a', namespace: 'b', path: '/x', operations: { echo: { input: undefined } } })

    assert.deepStrictEqual(carried.operations.echo, {})
  })

  it('leaves the manifest it was given alone', async () => {
    const manifest = await component(COMPONENT)
    const before = JSON.stringify(manifest)

    plain(manifest)

    assert.strictEqual(JSON.stringify(manifest), before)
  })

  it('is read beside the component wherever it is', async () => {
    const carried = carry(await component(COMPONENT))
    const revived = revive(carried, '/composition/external-consumer')

    assert.strictEqual(revived.path, '/composition/external-consumer')

    // what the component declares is in the component
    assert.strictEqual(
      revived.receivers['something_happened'].path,
      '/composition/external-consumer'
    )
  })

  it('reads what is inherited where the prototype is', async () => {
    const prototype = (await component(COMPONENT)).prototype.path
    const revived = revive(carry(await component(COMPONENT)), '/composition/external-consumer')

    // an event of the prototype's is in the prototype, wherever the component is
    assert.strictEqual(revived.events.created.path, prototype)
  })

  it('carries what is inherited by the package that holds it', async () => {
    const carried = carry(await component(COMPONENT))

    assert.strictEqual(carried.prototype.path, '@toa.io/prototype')
    assert.strictEqual(carried.events.created.path, '@toa.io/prototype')
    assert.strictEqual(carried.receivers['something_happened'].path, '.')
  })
})

describe('what cannot be carried', () => {
  it('leaves out where the manifest is and what only a deploy reads', async () => {
    const manifest = await component(PROTOTYPE)

    manifest.packages = { cloudinary: '2.11.0' }

    const carried = plain(manifest)

    assert.ok(!('locator' in carried))
    assert.ok(!('path' in carried))
    assert.ok(!('packages' in carried))
  })

  it('refuses a prototype an image would not have', async () => {
    const manifest = await component(EXTENDED)

    assert.throws(() => plain(manifest), /is in no package, so an image cannot carry what is in it/)
  })

  it('refuses a path inside the component it does not know about', () => {
    assert.throws(
      () => plain({ name: 'a', namespace: 'b', path: '/x', invented: { at: '/x/y' } }),
      /carries a path of the machine that read it/
    )
  })

  it('refuses a component directory it does not know about', async () => {
    const manifest = await component(PROTOTYPE)

    manifest.invented = { at: COMPONENT }

    assert.throws(() => plain(manifest), /carries a path of the machine that read it/)
  })

  it('leaves a value of the application\'s own alone', () => {
    const carried = plain({
      name: 'a',
      namespace: 'b',
      path: '/x',
      extensions: { exposition: { routes: [{ path: '/accounts' }] } }
    })

    assert.strictEqual(carried.extensions.exposition.routes[0].path, '/accounts')
  })
})
