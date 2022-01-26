'use strict'

const { join } = require('node:path')
const { readFile: read, writeFile: write, rm: remove } = require('node:fs/promises')
const execa = require('execa')

const { hash } = require('@toa.io/gears')
const { directory } = require('./directory')
const { copy } = require('./copy')

class Image {
  tag

  #composition
  #registry
  #runtime

  constructor (composition, context) {
    this.#composition = composition
    this.#registry = context.registry
    this.#runtime = context.runtime

    this.tag = context.registry + '/' + composition.name + ':' + Image.#tag(composition)
  }

  async build () {
    const path = await this.#context()
    const build = execa('docker', ['build', path, '-t', this.tag])

    build.stdout.pipe(process.stdout)

    await build

    await remove(path, { recursive: true })
  }

  async push () {
    const push = execa('docker', ['push', this.tag])

    push.stdout.pipe(process.stdout)

    await push
  }

  async #context () {
    const path = await directory.temp('composition')
    const dockerfile = (await read(DOCKERFILE, 'utf-8')).replace('{{version}}', this.#runtime)

    for (const component of this.#composition.components) {
      await copy(component.path, join(path, component.locator.id))
    }

    await write(join(path, 'Dockerfile'), dockerfile)

    return path
  }

  static #tag (composition) {
    const components = composition.components.map((component) => component.locator.id).join(';')

    return hash(components)
  }
}

const DOCKERFILE = join(__dirname, 'assets/Dockerfile')

exports.Image = Image
