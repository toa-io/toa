'use strict'

const { join } = require('node:path')
const boot = require('@toa.io/boot')

/**
 * @param {string} [environment]
 */
async function deployment (environment = undefined) {
  const context = this.cwd
  const target = join(this.cwd, 'deployment')
  const operator = await boot.deployment(context, environment)

  await operator.export(target)
}

async function images () {
  const context = this.cwd
  const target = join(this.cwd, 'images')
  const registry = await boot.registry(context)

  await registry.prepare(target)
}

exports.deployment = deployment
exports.images = images
