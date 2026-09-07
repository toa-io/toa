import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Registry } from './registry.js'

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
      if (args[0] === 'manifest') throw new Error('manifest unknown')

      if (args[0] === 'buildx' && args[1] === 'inspect')
        throw new Error('builder not found')

      return ''
    })
  }

  factory = /** @type {toa.deployment.images.Factory} */ {
    composition: () => createImage('composition-mono', true),
    service: () => createImage('extension-realtime'),
    mono: () => createImage('mono', true)
  }
})

it('should reuse named builder across images', async () => {
  const registry = createRegistry({
    base: 'example.com/reg',
    platforms: ['linux/amd64', 'linux/arm64']
  })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const creates = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) => args[0] === 'buildx' && args[1] === 'create'
  )

  assert.strictEqual(creates.length, 1)
  assert.deepStrictEqual(creates[0].arguments[1], [
    'buildx',
    'create',
    '--name',
    'toa',
    '--driver',
    'docker-container',
    '--driver-opt',
    'network=host',
    '--bootstrap'
  ])

  const builds = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) =>
      args[0] === '--context=default' && args[1] === 'buildx' && args[2] === 'build'
  )

  assert.strictEqual(builds.length, 3)

  for (const {
    arguments: [, args]
  } of builds) {
    assert.ok(args.includes('--builder'))
    assert.strictEqual(args[args.indexOf('--builder') + 1], 'toa')
  }
})

it('should not create builder when it already exists', async () => {
  process.execute = mock.fn(async (cmd, args) => {
    if (args[0] === 'manifest') throw new Error('manifest unknown')

    return ''
  })

  const registry = createRegistry({
    base: 'example.com/reg',
    platforms: ['linux/amd64', 'linux/arm64']
  })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const creates = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) => args[0] === 'buildx' && args[1] === 'create'
  )

  assert.strictEqual(creates.length, 0)
})

it('should not export a build cache', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) => args[0] === '--context=default' && args[2] === 'build'
  )

  assert.strictEqual(builds.length, 3)

  for (const {
    arguments: [, args]
  } of builds) {
    assert.ok(!args.includes('--cache-from'))
    assert.ok(!args.includes('--cache-to'))
  }
})

it('should use the default builder for a single platform', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const creates = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) => args[0] === 'buildx' && args[1] === 'create'
  )

  assert.strictEqual(creates.length, 0)

  const {
    arguments: [, args]
  } = process.execute.mock.calls.find(
    ({ arguments: [, args] }) => args[0] === '--context=default' && args[2] === 'build'
  )

  assert.strictEqual(args[args.indexOf('--builder') + 1], 'default')
  assert.ok(args.includes('--platform'))
  assert.strictEqual(args[args.indexOf('--platform') + 1], 'linux/amd64')
})

it('should create the builder once when images build concurrently', async () => {
  const registry = createRegistry({
    base: 'example.com/reg',
    platforms: ['linux/amd64', 'linux/arm64']
  })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))
  registry.mono(/** @type {any} */ ({}))

  await registry.build()

  const creates = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) => args[0] === 'buildx' && args[1] === 'create'
  )

  assert.strictEqual(creates.length, 1)
})

it('should probe every image before building any', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const calls = process.execute.mock.calls.map(({ arguments: [, args] }) => args[0])
  const build = calls.indexOf('--context=default')
  const probed = calls.slice(0, build).filter((argument) => argument === 'manifest')

  // every probe is spent before the first build starts, rather than one before each:
  // the composition, what it is laid over, and the service
  assert.strictEqual(probed.length, 3)
})

it('should build what an image is laid over before the image', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const tags = builds().map((args) => args[args.indexOf('--tag') + 1])
  const [composition] = images

  assert.strictEqual(tags.length, 3)
  assert.ok(
    tags.indexOf(composition.dependencies.reference) < tags.indexOf(composition.reference)
  )
})

it('should lay the image over what already exists', async () => {
  process.execute = mock.fn(async (cmd, args) => {
    if (args[0] === 'manifest' && !args[2].includes(':deps-'))
      throw new Error('manifest unknown')

    return ''
  })

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const tags = builds().map((args) => args[args.indexOf('--tag') + 1])
  const [composition] = images

  assert.deepStrictEqual(tags, [composition.reference])
  assert.strictEqual(composition.dependencies.prepare.mock.callCount(), 0)
  assert.strictEqual(composition.prepare.mock.callCount(), 1)
})

it('should prepare only what is missing', async () => {
  process.execute = mock.fn(async () => '')

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  for (const image of images) assert.strictEqual(image.prepare.mock.callCount(), 0)
})

it('should pass build arguments to the images that read them', async () => {
  const registry = createRegistry({
    base: 'example.com/reg',
    platforms: ['linux/amd64'],
    build: { arguments: ['TOKEN'] }
  })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const [composition] = images

  for (const args of builds()) {
    const tag = args[args.indexOf('--tag') + 1]
    const reads = tag === composition.dependencies.reference

    assert.strictEqual(args.includes('--build-arg'), reads, tag)
  }
})

it('should push on the container builder', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.push()

  for (const args of builds()) {
    assert.ok(args.includes('--push'))
    assert.strictEqual(args[args.indexOf('--builder') + 1], 'toa')
    assert.ok(args.includes('--provenance=false'))
  }
})

it('should not create the builder for a push when nothing is missing', async () => {
  process.execute = mock.fn(async (cmd, args) => {
    if (args[0] === 'buildx' && args[1] === 'inspect')
      throw new Error('builder not found')

    return ''
  })

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.push()

  assert.strictEqual(builds().length, 0)
})

it('should use default builder when platforms is null', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: null })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) => args[0] === '--context=default' && args[2] === 'build'
  )

  assert.strictEqual(builds.length, 2)

  for (const {
    arguments: [, args]
  } of builds) {
    assert.strictEqual(args[args.indexOf('--builder') + 1], 'default')
    assert.ok(!args.includes('--platform'))
  }
})

it('should skip build when image already exists', async () => {
  process.execute = mock.fn(async () => '')

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(
    ({ arguments: [, args] }) => args[0] === '--context=default' && args[2] === 'build'
  )

  assert.strictEqual(builds.length, 0)
  assert.ok(
    process.execute.mock.calls.some(
      (call) =>
        call.arguments.length === 3 &&
        isDeepStrictEqual(call.arguments[0], 'docker') &&
        isDeepStrictEqual(call.arguments[1], [
          'manifest',
          'inspect',
          images[0].reference
        ]) &&
        isDeepStrictEqual(call.arguments[2], { silently: true })
    )
  )
})

it('should probe a local registry as insecure', async () => {
  process.execute = mock.fn(async () => '')

  const registry = createRegistry({ base: 'localhost:5000', platforms: null })

  factory.composition = () => {
    const image = createImage('composition-mono', true)

    image.reference = 'localhost:5000/acme/composition-mono:abcdef12'
    image.dependencies.reference = 'localhost:5000/acme/composition-mono:deps-12345678'

    return image
  }

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const probes = process.execute.mock.calls
    .filter(({ arguments: [, args] }) => args[0] === 'manifest')
    .map(({ arguments: [, args] }) => args)

  assert.strictEqual(probes.length, 2)

  for (const args of probes)
    assert.deepStrictEqual(args.slice(0, 3), ['manifest', 'inspect', '--insecure'])
})

/**
 * @param {object} [registry]
 * @returns {Registry}
 */
function createRegistry(registry = {}) {
  return new Registry(registry, factory, process)
}

/**
 * @param {string} name
 * @param {boolean} [bundle] laid over an image of its dependencies
 * @returns {toa.deployment.images.Image}
 */
function createImage(name, bundle = false) {
  const image = /** @type {toa.deployment.images.Image} */ {
    reference: `example.com/reg/acme/${name}:abcdef12`,
    context: `/tmp/${name}`,
    prepare: mock.fn(async () => `/tmp/${name}`)
  }

  if (bundle)
    image.dependencies = /** @type {toa.deployment.images.Image} */ {
      reference: `example.com/reg/acme/${name}:deps-12345678`,
      context: `/tmp/dependencies/${name}`,
      arguments: true,
      prepare: mock.fn(async () => `/tmp/dependencies/${name}`)
    }

  images.push(image)

  return image
}

/** @returns {string[][]} the arguments of every build run */
function builds() {
  return process.execute.mock.calls
    .filter(
      ({ arguments: [, args] }) => args[0] === '--context=default' && args[2] === 'build'
    )
    .map(({ arguments: [, args] }) => args)
}
