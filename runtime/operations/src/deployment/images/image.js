'use strict'

const { join } = require('node:path')
const { readFile: read, writeFile: write } = require('node:fs/promises')

const { directory } = require('@toa.io/gears')

/**
 * @implements {toa.operations.deployment.images.Image}
 * @abstract
 */
class Image {
  url

  /**
   * @protected
   * @type {string}
   */
  dockerfile

  /** @type {toa.formation.context.Runtime} */
  #runtime
  /** @type {toa.operations.Process} */
  #process
  /** @type {string} */
  #context

  /**
   * @param runtime {toa.formation.context.Runtime}
   * @param process {toa.operations.Process}
   */
  constructor (runtime, process) {
    this.#runtime = runtime
    this.#process = process
  }

  /**
   * @abstract
   * @protected
   * @type {string}
   */
  get name () {}

  /**
   * @abstract
   * @protected
   * @type {string}
   */
  get key () {}

  async prepare (root) {
    if (this.dockerfile === undefined) throw new Error('Dockerfile isn\'t specified')

    const path = join(root, this.name)

    await directory.ensure(path)

    const dockerfile = (await read(this.dockerfile, 'utf-8'))
      .replace(/{{(\w+)}}/g, (_, key) => this.#runtime[key])

    await write(join(path, 'Dockerfile'), dockerfile)

    this.#context = path

    return path
  }

  tag (registry) {
    this.url = registry + '/' + this.name + ':' + this.key
  }

  async build () {
    if (this.url === undefined) throw new Error('Image hasn\'t been tagged')
    if (this.#context === undefined) throw new Error('Image hasn\'t been built')

    await this.#process.execute('docker', ['build', this.#context, '-t', this.url])
  }

  async push () {
    await this.#process.execute('docker', ['push', this.url])
  }
}

exports.Image = Image
