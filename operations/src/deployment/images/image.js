'use strict'

const { join, posix } = require('node:path')
const { readFile: read, writeFile: write } = require('node:fs/promises')

const { hash, overwrite } = require('@toa.io/generic')
const fs = require('fs-extra')

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

  /** @type {toa.norm.context.Registry} */
  #registry

  /** @type {toa.norm.context.Runtime} */
  #runtime

  /** @type {{ runtime?: Partial<toa.norm.context.Runtime>, build: object }} */
  #values = { build: { command: 'echo hello' } }

  /**
   * @param {string} scope
   * @param {toa.norm.context.Runtime} runtime
   * @param {toa.norm.context.Registry} registry
   */
  constructor (scope, runtime, registry) {
    this.#scope = scope
    this.#registry = registry
    this.#runtime = runtime

    this.#setValues()
  }

  tag () {
    const tag = hash(this.#runtime?.version + ';' + this.version)

    this.reference = posix.join(this.#registry.base ?? '', this.#scope, `${this.name}:${tag}`)
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

  async prepare (root) {
    if (this.dockerfile === undefined) throw new Error('Dockerfile isn\'t specified')

    const path = join(root, `${this.name}.${this.version}`)

    await fs.ensureDir(path)

    const template = await read(this.dockerfile, 'utf-8')
    const contents = template.replace(/{{(\S{1,32})}}/g, (_, key) => this.#value(key))
    const ignore = 'Dockerfile'

    await write(join(path, 'Dockerfile'), contents)
    await write(join(path, '.dockerignore'), ignore)

    this.context = path

    return path
  }

  #setValues () {
    this.#values.runtime = this.#runtime
    this.#values.build = overwrite(this.#values.build, this.#registry.build)

    if (this.#values.build.arguments !== undefined) this.#values.build.arguments = createArguments(this.#values.build.arguments)
    if (this.#values.build.run !== undefined) this.#values.build.run = createRunCommands(this.#values.build.run)
  }

  /**
   * @param key {string}
   * @returns {string}
   */
  #value (key) {
    const [source, property] = key.split('.')

    return this.#values[source]?.[property] ?? ''
  }
}

function createRunCommands (input) {
  const lines = input.split('\n')

  return lines.reduce((commands, command) => {
    commands += '\nRUN ' + command

    return commands
  }, '')
}

function createArguments (variables) {
  const args = []

  for (const variable of variables) {
    args.push('ARG ' + variable)
    args.push(`ENV ${variable}=$${variable}`)
  }

  return args.join('\n')
}

exports.Image = Image
