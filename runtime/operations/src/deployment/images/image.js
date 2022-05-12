'use strict'

const { join, posix } = require('node:path')
const { readFile: read, writeFile: write } = require('node:fs/promises')

const { directory } = require('@toa.io/gears')

// noinspection JSClosureCompilerSyntax
/**
 * @implements {toa.operations.deployment.images.Image}
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
  /** @type {toa.formation.context.Runtime} */
  #runtime

  /**
   * @param scope {string}
   * @param runtime {toa.formation.context.Runtime}
   */
  constructor (scope, runtime) {
    this.#scope = scope
    this.#runtime = runtime
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

  tag (base) {
    this.reference = posix.join(base, `${this.#scope}/${this.name}:${this.key}`)
  }

  async prepare (root) {
    if (this.dockerfile === undefined) throw new Error('Dockerfile isn\'t specified')

    const path = join(root, this.name)

    await directory.ensure(path)

    const dockerfile = (await read(this.dockerfile, 'utf-8'))
      .replace(/{{(\w+)}}/g, (_, key) => this.#runtime[key])

    await write(join(path, 'Dockerfile'), dockerfile)

    this.context = path

    return path
  }
}

exports.Image = Image
