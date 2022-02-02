'use strict'

const { join } = require('node:path')
const { readFile: read, writeFile: write } = require('node:fs/promises')

const { hash } = require('@toa.io/gears')
const { copy } = require('../util/copy')
const { directory } = require('../util/directory')

class Image {
  tag

  #composition
  #registry
  #runtime

  #context
  #process

  constructor (composition, context, process) {
    this.#composition = composition
    this.#registry = context.registry
    this.#runtime = context.runtime

    this.tag = context.registry + '/' + composition.name + ':' + this.#tag(composition)

    this.#process = process
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

    this.#context = path
  }

  async build () {
    if (this.#context === undefined) throw new Error('Image context hasn\'t been exported')

    await this.#process.execute('docker', ['build', this.#context, '-t', this.tag])
  }

  async push () {
    await this.#process.execute('docker', ['push', this.tag])
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
