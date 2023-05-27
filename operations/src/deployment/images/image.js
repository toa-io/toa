'use strict'

const { join, posix } = require('node:path')
const { readFile: read, writeFile: write } = require('node:fs/promises')

const { hash } = require('@toa.io/generic')
const { directory } = require('@toa.io/filesystem')

/**
 * @implements {toa.deployment.images.Image}
 * @abstract
 */
class Image {
  context
  reference

  /**
   * @protected
   * @type {string}
   */
  dockerfile

  /** @type {string} */
  #scope
  /** @type {toa.norm.context.Runtime} */
  #runtime
  /** @type {string} */
  #type

  /**
   * @param scope {string}
   * @param runtime {toa.norm.context.Runtime}
   */
  constructor (scope, runtime) {
    this.#scope = scope
    this.#runtime = runtime
    this.#type = this.constructor.name.toLowerCase()
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
  get version () {}

  tag (base) {
    const tag = hash(this.#runtime?.version + ';' + this.version)

    this.reference = posix.join(base ?? '', this.#scope, `${this.#type}-${this.name}:${tag}`)
  }

  async prepare (root) {
    if (this.dockerfile === undefined) throw new Error('Dockerfile isn\'t specified')

    const path = join(root, `${this.#type}-${this.name}.${this.version}`)

    await directory.ensure(path)

    const template = await read(this.dockerfile, 'utf-8')
    const contents = template.replace(/{{(\.?\w+)}}/g, (_, key) => this.#value(key))
    const ignore = 'Dockerfile'

    await write(join(path, 'Dockerfile'), contents)
    await write(join(path, '.dockerignore'), ignore)

    this.context = path

    return path
  }

  /**
   * @param key {string}
   * @returns {string}
   */
  #value (key) {
    const [, property] = key.split('.')

    if (property !== undefined) return this[property]
    else return this.#runtime[key]
  }
}

exports.Image = Image
