'use strict'

const { join } = require('node:path')
const { readFile: read, writeFile: write } = require('node:fs/promises')

const { directory } = require('../../util/directory')

class Image {
  dockerfile

  #registry
  #runtime

  #context
  #process

  constructor (context, process) {
    this.#registry = context.registry
    this.#runtime = context.runtime
    this.#process = process
  }

  async export (root) {
    const path = join(root, this.name)

    await directory(path)

    const dockerfile = (await read(this.dockerfile, 'utf-8'))
      .replace(/{{(\w+)}}/g, (_, key) => this.#runtime[key])

    await write(join(path, 'Dockerfile'), dockerfile)

    this.#context = path

    return path
  }

  async build () {
    if (this.#context === undefined) throw new Error('Image context hasn\'t been exported')

    await this.#process.execute('docker', ['build', this.#context, '-t', this.tag])
  }

  async push () {
    await this.#process.execute('docker', ['push', this.tag])
  }

  get tag () {
    return this.registry + '/' + this.name + ':' + this.key
  }

  get name () {
    throw new Error('Not implemented')
  }

  get key () {
    throw new Error('Not implemented')
  }
}

exports.Image = Image
