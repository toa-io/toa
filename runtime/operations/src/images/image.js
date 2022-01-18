'use strict'

const { join } = require('node:path')
const execa = require('execa')

class Image {
  #manifest
  #registry
  #tag

  constructor (manifest, registry) {
    this.#manifest = manifest
    this.#registry = registry

    const { domain, name, version } = this.#manifest
    this.#tag = this.#registry + '/' + domain + '-' + name + ':' + version
  }

  async build () {
    const build = execa('docker', ['build', this.#manifest.path, '-f', DOCKERFILE, '-t', this.#tag])

    build.stdout.pipe(process.stdout)

    await build
  }

  async push () {
    const push = execa('docker', ['push', this.#tag])

    push.stdout.pipe(process.stdout)

    await push
  }
}

const DOCKERFILE = join(__dirname, 'Dockerfile')

exports.Image = Image
