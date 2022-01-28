'use strict'

const { join } = require('node:path')
const { readFile: read, writeFile: write, rm: remove } = require('node:fs/promises')
const execa = require('execa')

const { hash } = require('@toa.io/gears')
const { copy } = require('./copy')
const { directory } = require('./directory')

class Image {
  tag

  #composition
  #registry
  #runtime

  constructor (composition, context) {
    this.#composition = composition
    this.#registry = context.registry
    this.#runtime = context.runtime

    this.tag = context.registry + '/' + composition.name + ':' + this.#tag(composition)
  }

  async build (root) {
    const path = await this.export(root)
    const build = execa('docker', ['build', path, '-t', this.tag])

    build.stdout.pipe(process.stdout)

    await build

    await remove(path, { recursive: true })
  }

  async export (root) {
    const path = join(root, this.#composition.name)

    await directory(path)

    const dockerfile = (await read(DOCKERFILE, 'utf-8'))
      .replace(/{{(\w+)}}/g, (_, key) => this.#runtime[key])

    for (const component of this.#composition.components) {
      await copy(component.path, join(path, component.locator.label))
    }

    await write(join(path, 'Dockerfile'), dockerfile)

    return path
  }

  async push () {
    const push = execa('docker', ['push', this.tag])

    push.stdout.pipe(process.stdout)

    await push
  }

  #tag (composition) {
    const components = composition.components.map(
      (component) => component.locator.id + ':' + component.version).join(';')

    const tag = this.#runtime.version + ';' + components

    return hash(tag)
  }
}

const DOCKERFILE = join(__dirname, 'assets/Dockerfile')

exports.Image = Image
