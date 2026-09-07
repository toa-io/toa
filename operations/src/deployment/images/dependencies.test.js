import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { join } from 'node:path'
import { mkdtemp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { Composition } from './composition.js'
import { Mono } from './mono.js'

/** @type {string} */
let root

/** @type {toa.norm.context.Runtime} */
let runtime

/** @type {toa.norm.context.Registry} */
let registry

/** @type {object} */
let composition

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'toa-dependencies-test'))
  runtime = { version: '1.0.0-alpha.288' }
  registry = { base: 'example.com/reg', platforms: ['linux/amd64'] }

  composition = {
    name: 'mono',
    components: [
      await component('one', { dependencies: { left: '1.0.0' } }),
      await component('two'),
      await component('three', { devDependencies: { right: '1.0.0' } }, 'lock')
    ]
  }
})

describe('reference', () => {
  it('should share the repository and stand a prefix apart', () => {
    const image = create()

    assert.match(
      image.dependencies.reference,
      /^example\.com\/reg\/acme\/composition-mono:deps-[0-9a-f]{8}$/
    )
    assert.match(
      image.reference,
      /^example\.com\/reg\/acme\/composition-mono:[0-9a-f]{8}$/
    )
    assert.strictEqual(image.base, image.dependencies.reference)
  })

  it('should be the same for the same inputs', () => {
    assert.strictEqual(create().dependencies.reference, create().dependencies.reference)
  })

  it('should change with a manifest', async () => {
    const before = create()

    await writeFile(
      join(composition.components[0].path, 'package.json'),
      JSON.stringify({ dependencies: { left: '1.0.1' } })
    )

    const after = create()

    assert.notStrictEqual(after.dependencies.reference, before.dependencies.reference)
    assert.notStrictEqual(after.reference, before.reference)
  })

  it('should change with a lockfile', async () => {
    const before = create()

    await writeFile(join(composition.components[2].path, 'package-lock.json'), 'other')

    assert.notStrictEqual(create().dependencies.reference, before.dependencies.reference)
  })

  it('should change with what is run and with the runtime', () => {
    const before = create()

    composition.components[1].build = { run: 'apk add git' }

    const run = create()

    assert.notStrictEqual(run.dependencies.reference, before.dependencies.reference)

    runtime.version = '1.0.0-alpha.289'

    assert.notStrictEqual(create().dependencies.reference, run.dependencies.reference)
  })

  it('should change with what an extension installs', () => {
    const before = create()

    composition.components[1].packages = { cloudinary: '2.11.0' }

    const component = create()

    assert.notStrictEqual(component.dependencies.reference, before.dependencies.reference)

    composition.packages = { 'lru-cache': '11.5.2' }

    assert.notStrictEqual(create().dependencies.reference, component.dependencies.reference)
  })

  it('should change with the registry build settings', () => {
    const before = create()

    registry.build = { arguments: ['TOKEN'] }

    assert.notStrictEqual(create().dependencies.reference, before.dependencies.reference)
  })

  it('should not change with the sources', async () => {
    const before = create()

    await writeFile(
      join(composition.components[0].path, 'index.js'),
      'export const changed = true'
    )
    composition.components[0].version = 'ffffffff'

    const after = create()

    assert.strictEqual(after.dependencies.reference, before.dependencies.reference)
    assert.notStrictEqual(after.reference, before.reference)
  })
})

describe('prepare', () => {
  it('should hold the manifests and nothing else', async () => {
    const image = create()
    const context = await image.dependencies.prepare(root)

    assert.strictEqual(
      context,
      join(root, 'dependencies', `composition-mono.${image.dependencies.version}`)
    )

    const entries = (await readdir(context, { recursive: true })).sort()

    assert.deepStrictEqual(entries, [
      '.dockerignore',
      '.packages',
      'Dockerfile',
      'one',
      'one/package.json',
      'three',
      'three/package-lock.json',
      'three/package.json'
    ])

    const dockerfile = await readFile(join(context, 'Dockerfile'), 'utf8')

    assert.ok(dockerfile.includes('FROM ghcr.io/toa-io/runtime:1.0.0-alpha.288'))
    assert.ok(dockerfile.includes('npm i --omit=dev'))
    assert.ok(dockerfile.includes('WORKDIR /composition'))
    assert.doesNotMatch(dockerfile, /USER node|CMD /)
  })

  it('should hold what the extensions install, deduplicated and ordered', async () => {
    composition.components[0].packages = { cloudinary: '2.11.0' }
    composition.components[1].packages = {
      cloudinary: '2.11.0',
      '@aws-sdk/client-s3': '3.1125.0'
    }

    const image = create()
    const context = await image.dependencies.prepare(root)

    assert.strictEqual(
      await readFile(join(context, '.packages'), 'utf8'),
      '@aws-sdk/client-s3@3.1125.0\ncloudinary@2.11.0'
    )

    const dockerfile = await readFile(join(context, 'Dockerfile'), 'utf8')

    assert.ok(
      dockerfile.includes('npm i --prefix /toa --omit=dev --legacy-peer-deps $(cat .packages)')
    )
  })

  it('should hold what a service the composition runs brings', async () => {
    composition.packages = { 'lru-cache': '11.5.2' }
    composition.components[0].packages = { cloudinary: '2.11.0' }

    const context = await create().dependencies.prepare(root)

    assert.strictEqual(
      await readFile(join(context, '.packages'), 'utf8'),
      'cloudinary@2.11.0\nlru-cache@11.5.2'
    )
  })

  it('should hold an empty list where nothing is declared', async () => {
    const context = await create().dependencies.prepare(root)

    assert.strictEqual(await readFile(join(context, '.packages'), 'utf8'), '')
  })

  it('should lay the sources over the dependencies', async () => {
    const image = create()

    image.dependencies.tag()

    const context = await image.prepare(root)
    const dockerfile = await readFile(join(context, 'Dockerfile'), 'utf8')
    const lines = dockerfile
      .split('\n')
      .filter((line) => line !== '' && !line.startsWith('#'))

    // no USER: the runtime starts as root and drops to `node` itself, and nothing else
    // touches the filesystem, which is what lets the layer be laid over a base never pulled
    assert.deepStrictEqual(lines, [
      `FROM ${image.dependencies.reference}`,
      'COPY --link . /composition',
      'CMD toa compose *'
    ])

    const entries = (await readdir(context, { recursive: true })).sort()

    assert.ok(entries.includes('one/index.js'))
    assert.ok(entries.includes('two/package.json')) // declared for the component that had none
    assert.ok(entries.includes('one/manifest.toa.json')) // what the process reads instead of normalizing
    assert.ok(!entries.some((entry) => entry.includes('node_modules')))
  })

  it('should run mono the same way', async () => {
    const image = new Mono('acme', runtime, registry, composition)

    image.tag()

    assert.match(image.dependencies.reference, /\/mono:deps-[0-9a-f]{8}$/)

    const context = await image.prepare(root)
    const dockerfile = await readFile(join(context, 'Dockerfile'), 'utf8')

    assert.ok(dockerfile.includes('CMD toa mono *'))
    assert.doesNotMatch(dockerfile, /^USER /m)
  })
})

/** @returns {Composition} */
function create() {
  const image = new Composition('acme', runtime, registry, composition)

  image.tag()

  return image
}

/**
 * @param {string} label
 * @param {object} [manifest]
 * @param {string} [lock]
 */
async function component(label, manifest, lock) {
  const path = join(root, 'components', label)

  await mkdir(join(path, 'node_modules', 'left'), { recursive: true })
  await writeFile(join(path, 'index.js'), 'export const changed = false')
  await writeFile(join(path, 'node_modules', 'left', 'index.js'), '')

  if (manifest !== undefined)
    await writeFile(join(path, 'package.json'), JSON.stringify(manifest))
  if (lock !== undefined) await writeFile(join(path, 'package-lock.json'), lock)

  return { path, version: 'abcdef12', locator: { id: `default.${label}`, label } }
}
