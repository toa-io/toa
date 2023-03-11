'use strict'

const { join } = require('node:path')
const boot = require('@toa.io/boot')

/**
 * @param {string} [environment]
 */
async function ex (environment= undefined) {
  const context = this.cwd
  const target = join(this.cwd, 'deployment')
  const operator = await boot.deployment(context, environment)

  await operator.export(target)
}

exports.ex = ex
