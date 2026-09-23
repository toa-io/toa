import { describe, it, before, mock } from 'node:test'
import assert from 'node:assert/strict'

import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import * as norm from '@toa.io/norm'

/** what each build was given, in order */
const built = []

mock.module('@toa.io/operations', {
  exports: {
    deployment: {
      Factory: class {
        constructor(context) {
          built.push(context)
        }

        registry() {
          return { build: async () => undefined, tags: () => ['composition'] }
        }
      }
    }
  }
})

const { build } = await import('../src/handlers/docker/build.js')

/** @type {string} */
let root

/** @type {string} */
let one

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'toa-dock-test'))
  one = await component(root, 'one', 'storages: pictures')

  await component(root, 'two')

  await writeFile(
    join(root, 'context.toa.yaml'),
    [
      'name: dock',
      'registry: localhost:5000',
      'storages:',
      '  pictures:',
      '    provider: cloudinary',
      '    environment: demo',
      '    type: image',
      'compositions:',
      '  - name: edge',
      '    components: [dummies.one]',
      '    services: [exposition]'
    ].join('\n')
  )
})

describe('the image', () => {
  it('should be the composition’s', async () => {
    assert.equal(await build(root, [one]), 'composition')
  })
})

describe('the composition built', () => {
  it('should be made of the components asked for, as the context has them', async () => {
    const context = await compose([one])
    const [composition] = context.compositions

    assert.equal(context.compositions.length, 1)
    assert.match(composition.name, /^temp-/)
    assert.deepEqual(
      composition.components.map((component) => component.locator.id),
      ['dummies.one']
    )
    assert.ok(context.components.includes(composition.components[0]))
  })

  it('should install what the extensions need for what its components declare', async () => {
    const [composition] = (await compose([one])).compositions

    assert.deepEqual(composition.components[0].packages, { cloudinary: '2.11.0' })
  })

  it('should install what a composition running the services it runs installs', async () => {
    const declared = await norm.context(root, 'docker')
    const edge = declared.compositions.find(({ name }) => name === 'edge')
    const [composition] = (await compose([one], ['exposition'])).compositions

    assert.ok(
      Object.keys(edge.packages ?? {}).length > 0,
      'the fixture runs nothing installed'
    )
    assert.deepEqual(composition.packages, edge.packages)
  })

  it('should install nothing for services where it runs none', async () => {
    const [composition] = (await compose([one])).compositions

    assert.equal(composition.packages, undefined)
  })

  it('should refuse a component that is not the context’s', async () => {
    const elsewhere = await mkdtemp(join(tmpdir(), 'toa-dock-test-elsewhere'))
    const stray = await component(elsewhere, 'stray')

    await assert.rejects(compose([stray]), (error) => {
      assert.match(error.message, /is not a component of the context/)
      assert.ok(error.message.includes(stray))

      return true
    })
  })
})

/**
 * @param {string[]} paths
 * @param {string[]} [services]
 * @return {Promise<toa.norm.Context>}
 */
async function compose(paths, services) {
  await build(root, paths, services)

  return built.at(-1)
}

/**
 * @param {string} root
 * @param {string} name
 * @param {string} [declaration]
 * @return {Promise<string>}
 */
async function component(root, name, declaration = '') {
  const path = join(root, 'components', name)

  await mkdir(path, { recursive: true })
  await writeFile(
    join(path, 'manifest.toa.yaml'),
    `name: ${name}\nnamespace: dummies\n${declaration}\n`
  )

  return path
}
