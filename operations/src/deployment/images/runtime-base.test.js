'use strict'

const { join } = require('node:path')
const { readFile } = require('node:fs/promises')
const { directory } = require('@toa.io/filesystem')

const { Image, RUNTIME_IMAGE } = require('./image')

const compositionDockerfile = join(__dirname, 'composition.Dockerfile')
const serviceDockerfile = join(__dirname, 'service.Dockerfile')

class TestImage extends Image {
  dockerfile

  #name
  #base

  constructor (runtime, registry, dockerfile, name = 'test', base) {
    super('acme', runtime, registry)

    this.dockerfile = dockerfile
    this.#name = name
    this.#base = base
  }

  get name () {
    return this.#name
  }

  get version () {
    return 'abcdef12'
  }

  get base () {
    return this.#base
  }
}

describe('runtime base image', () => {
  /** @type {string} */
  let root

  beforeEach(async () => {
    root = await directory.temp('toa-runtime-base-test')
  })

  it('should default build.image to version-pinned GHCR runtime image', async () => {
    const runtime = { version: '1.0.0-alpha.232' }
    const image = new TestImage(runtime, {}, compositionDockerfile)

    const path = await image.prepare(root)
    const dockerfile = await readFile(join(path, 'Dockerfile'), 'utf8')

    expect(dockerfile).toContain(`FROM ${RUNTIME_IMAGE}:1.0.0-alpha.232`)
    expect(dockerfile).not.toMatch(/npm i -g @toa\.io\/runtime/)
  })

  it('should not install runtime in service Dockerfile template', async () => {
    const runtime = { version: '1.0.0-alpha.99' }
    const image = new TestImage(runtime, {}, serviceDockerfile, 'service-test')

    const path = await image.prepare(root)
    const dockerfile = await readFile(join(path, 'Dockerfile'), 'utf8')

    expect(dockerfile).toContain(`FROM ${RUNTIME_IMAGE}:1.0.0-alpha.99`)
    expect(dockerfile).not.toMatch(/npm i -g @toa\.io\/runtime/)
  })

  it('should allow registry.build.image override', async () => {
    const runtime = { version: '1.0.0-alpha.232' }
    const registry = { build: { image: 'node:24.14.0-alpine3.22' } }
    const image = new TestImage(runtime, registry, compositionDockerfile)

    const path = await image.prepare(root)
    const dockerfile = await readFile(join(path, 'Dockerfile'), 'utf8')

    expect(dockerfile).toContain('FROM node:24.14.0-alpine3.22')
    expect(dockerfile).not.toContain(RUNTIME_IMAGE)
  })

  it('should allow composition.image override via base', async () => {
    const runtime = { version: '1.0.0-alpha.232' }
    const image = new TestImage(runtime, {}, compositionDockerfile, 'mono', 'custom.example/base:1')

    const path = await image.prepare(root)
    const dockerfile = await readFile(join(path, 'Dockerfile'), 'utf8')

    expect(dockerfile).toContain('FROM custom.example/base:1')
  })
})
