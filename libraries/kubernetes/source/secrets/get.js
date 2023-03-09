'use strict'

const { execute } = require('@toa.io/command')

/** @type {toa.kubernetes.secrets.Get} */
const get = async (name) => {
  const command = `kubectl get secret ${name} -o json`
  const process = await execute(command)

  if (process.exitCode !== 0) return null
  else return JSON.parse(process.output)
}

exports.get = get
