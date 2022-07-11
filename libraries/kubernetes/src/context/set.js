'use strict'

const { execute } = require('@toa.io/libraries/command')

/** @type {toa.kubernetes.context.Set} */
const set = async (context) => {
  const process = await execute('kubectx ' + context)

  if (process.exitCode !== 0) throw new Error(process.error)
}

exports.set = set
