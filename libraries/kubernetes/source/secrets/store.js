'use strict'

const { execute } = require('@toa.io/command')

/** @type {toa.kubernetes.secrets.Store} */
const store = async (name, values, type = 'generic') => {
  await execute(`kubectl delete secret ${name} --ignore-not-found`)

  const args = formatArgs(values)
  const command = `kubectl create secret ${type} ${name} ${args}`

  const process = await execute(command)

  if (process.exitCode !== 0) throw new Error(process.error)
}

function formatArgs (values) {
  const args = []

  for (const [key, value] of Object.entries(values)) {
    const argument = `--from-literal=${key}=${value}`

    args.push(argument)
  }

  return args.join(' ')
}

exports.store = store
