'use strict'

const { execute } = require('@toa.io/libraries/command')

/** @type {toa.kubernetes.context.Get} */
const get = async () => {
  const process = await execute('kubectx -c')

  if (process.exitCode !== 0) throw new Error(process.error)

  return process.output
}

exports.get = get
