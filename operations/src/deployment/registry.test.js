'use strict'

const { it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const { Registry } = require('./registry')

/** @type {toa.operations.Process} */
let process

/** @type {toa.deployment.images.Factory} */
let factory

/** @type {toa.deployment.images.Image[]} */
let images

beforeEach(() => {
  images = []
  process = /** @type {toa.operations.Process} */ {
    execute: mock.fn(async (cmd, args) => {
      if (args[0] === 'manifest')
        throw new Error('manifest unknown')

      if (args[0] === 'buildx' && args[1] === 'inspect')
        throw new Error('builder not found')

      return ''
    })
  }

  factory = /** @type {toa.deployment.images.Factory} */ {
    composition: () => createImage('composition-mono'),
    service: () => createImage('extension-realtime')
  }
})

it('should reuse named builder across images', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const creates = process.execute.mock.calls.filter(({ arguments: [, args] }) =>
    args[0] === 'buildx' && args[1] === 'create')

  assert.strictEqual(creates.length, 1)
  assert.deepStrictEqual(creates[0].arguments[1], ['buildx', 'create', '--name', 'toa', '--bootstrap'])

  const builds = process.execute.mock.calls.filter(({ arguments: [, args] }) =>
    args[0] === '--context=default' && args[1] === 'buildx' && args[2] === 'build')

  assert.strictEqual(builds.length, 2)

  for (const { arguments: [, args] } of builds) {
    assert.ok(args.includes('--builder'))
    assert.strictEqual(args[args.indexOf('--builder') + 1], 'toa')
  }
})

it('should not create builder when it already exists', async () => {
  process.execute = mock.fn(async (cmd, args) => {
    if (args[0] === 'manifest')
      throw new Error('manifest unknown')

    return ''
  })

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const creates = process.execute.mock.calls.filter(({ arguments: [, args] }) =>
    args[0] === 'buildx' && args[1] === 'create')

  assert.strictEqual(creates.length, 0)
})

it('should add shared registry cache flags when base is set', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(({ arguments: [, args] }) =>
    args[0] === '--context=default' && args[2] === 'build')

  assert.strictEqual(builds.length, 2)

  for (const { arguments: [, args] } of builds) {
    assert.ok(args.includes('--cache-from'))
    assert.ok(args.includes('type=registry,ref=example.com/reg/acme/buildcache'))
    assert.ok(args.includes('--cache-to'))
    assert.ok(args.includes('type=registry,ref=example.com/reg/acme/buildcache,mode=max,image-manifest=true'))
  }
})

it('should omit cache flags when base is not set', async () => {
  const registry = createRegistry({ platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(({ arguments: [, args] }) =>
    args[0] === '--context=default' && args[2] === 'build')

  assert.strictEqual(builds.length, 1)

  const { arguments: [, args] } = builds[0]

  assert.ok(!(args.includes('--cache-from')))
  assert.ok(!(args.includes('--cache-to')))
})

it('should use default builder when platforms is null', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: null })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(({ arguments: [, args] }) =>
    args[0] === '--context=default' && args[2] === 'build')

  assert.strictEqual(builds.length, 1)

  const { arguments: [, args] } = builds[0]

  assert.strictEqual(args[args.indexOf('--builder') + 1], 'default')
  assert.ok(!(args.includes('--cache-from')))
  assert.ok(!(args.includes('--platform')))
})

it('should skip build when image already exists', async () => {
  process.execute = mock.fn(async () => '')

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(({ arguments: [, args] }) =>
    args[0] === '--context=default' && args[2] === 'build')

  assert.strictEqual(builds.length, 0)
  assert.ok(process.execute.mock.calls.some((call) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], 'docker') && isDeepStrictEqual(call.arguments[1], ['manifest', 'inspect', images[0].reference]) && isDeepStrictEqual(call.arguments[2], { silently: true })))
})

/**
 * @param {object} [registry]
 * @returns {Registry}
 */
function createRegistry (registry = {}) {
  return new Registry('acme', registry, factory, process)
}

/**
 * @param {string} name
 * @returns {toa.deployment.images.Image}
 */
function createImage (name) {
  const image = /** @type {toa.deployment.images.Image} */ {
    reference: `example.com/reg/acme/${name}:abcdef12`,
    context: `/tmp/${name}`,
    prepare: mock.fn(async () => `/tmp/${name}`)
  }

  images.push(image)

  return image
}
