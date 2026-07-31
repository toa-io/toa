'use strict'

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
    execute: jest.fn(async (cmd, args) => {
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

  const creates = process.execute.mock.calls.filter(([, args]) =>
    args[0] === 'buildx' && args[1] === 'create')

  expect(creates).toHaveLength(1)
  expect(creates[0][1]).toEqual(['buildx', 'create', '--name', 'toa', '--bootstrap'])

  const builds = process.execute.mock.calls.filter(([, args]) =>
    args[0] === '--context=default' && args[1] === 'buildx' && args[2] === 'build')

  expect(builds).toHaveLength(2)

  for (const [, args] of builds) {
    expect(args).toContain('--builder')
    expect(args[args.indexOf('--builder') + 1]).toBe('toa')
  }
})

it('should not create builder when it already exists', async () => {
  process.execute = jest.fn(async (cmd, args) => {
    if (args[0] === 'manifest')
      throw new Error('manifest unknown')

    return ''
  })

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const creates = process.execute.mock.calls.filter(([, args]) =>
    args[0] === 'buildx' && args[1] === 'create')

  expect(creates).toHaveLength(0)
})

it('should add shared registry cache flags when base is set', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))
  registry.service('.', /** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(([, args]) =>
    args[0] === '--context=default' && args[2] === 'build')

  expect(builds).toHaveLength(2)

  for (const [, args] of builds) {
    expect(args).toContain('--cache-from')
    expect(args).toContain('type=registry,ref=example.com/reg/acme/buildcache')
    expect(args).toContain('--cache-to')
    expect(args).toContain('type=registry,ref=example.com/reg/acme/buildcache,mode=max,image-manifest=true')
  }
})

it('should omit cache flags when base is not set', async () => {
  const registry = createRegistry({ platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(([, args]) =>
    args[0] === '--context=default' && args[2] === 'build')

  expect(builds).toHaveLength(1)

  const [, args] = builds[0]

  expect(args).not.toContain('--cache-from')
  expect(args).not.toContain('--cache-to')
})

it('should use default builder when platforms is null', async () => {
  const registry = createRegistry({ base: 'example.com/reg', platforms: null })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(([, args]) =>
    args[0] === '--context=default' && args[2] === 'build')

  expect(builds).toHaveLength(1)

  const [, args] = builds[0]

  expect(args[args.indexOf('--builder') + 1]).toBe('default')
  expect(args).not.toContain('--cache-from')
  expect(args).not.toContain('--platform')
})

it('should skip build when image already exists', async () => {
  process.execute = jest.fn(async () => '')

  const registry = createRegistry({ base: 'example.com/reg', platforms: ['linux/amd64'] })

  registry.composition(/** @type {any} */ ({}))

  await registry.build()

  const builds = process.execute.mock.calls.filter(([, args]) =>
    args[0] === '--context=default' && args[2] === 'build')

  expect(builds).toHaveLength(0)
  expect(process.execute).toHaveBeenCalledWith('docker', ['manifest', 'inspect', images[0].reference], { silently: true })
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
    prepare: jest.fn(async () => `/tmp/${name}`)
  }

  images.push(image)

  return image
}
