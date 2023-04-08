'use strict'

const boot = require('@toa.io/boot')
const { context: find } = require('../util/find')
const { file } = require('@toa.io/filesystem')
const { TOA_ENV_VAR } = require('../constants')

async function env (argv) {
  const path = find(argv.path)
  const operator = await boot.deployment(path, argv.environment)
  const variables = operator.variables()
  const envData = variables.global.filter(item => item.name !== TOA_ENV_VAR).map(item => `${item.name}=${item.value ?? ''}`)

  await file.write(`${path}/.env`, [`${TOA_ENV_VAR}=${argv.environment}`, ...envData].join('\n'))
}

exports.env = env
