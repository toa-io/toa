import { join } from 'node:path'
import * as operations from '@toa.io/operations'

const { Factory } = operations.deployment

/**
 * @param {string} [environment]
 */
async function deployment (environment = undefined, options = {}) {
  const context = this.cwd
  const target = join(this.cwd, 'deployment')
  const factory = await Factory.create(context, environment, options)
  const operator = await factory.operator()

  await operator.export(target)
}

async function images () {
  const context = this.cwd
  const target = join(this.cwd, 'images')
  const factory = await Factory.create(context)
  const registry = factory.registry(context)

  await registry.prepare(target)
}

export { deployment, images }
