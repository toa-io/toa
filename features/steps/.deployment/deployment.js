'use strict'

const { join } = require('node:path')
const { deployment: { Factory } } = require('@toa.io/operations')

/**
 * @param {string} [environment]
 */
async function deployment (environment = undefined) {
  const context = this.cwd
  const target = join(this.cwd, 'deployment')
  const factory = await Factory.create(context, environment)
  const operator = factory.operator()

  await operator.export(target)
}

async function images () {
  const context = this.cwd
  const target = join(this.cwd, 'images')
  const factory = await Factory.create(context)
  const registry = factory.registry(context)

  await registry.prepare(target)
}

exports.deployment = deployment
exports.images = images
