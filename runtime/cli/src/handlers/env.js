'use strict'

const boot = require('@toa.io/boot')
const { context: find } = require('../util/find')
const { file } = require('@toa.io/filesystem')

async function env (argv) {
  const path = find(argv.path)
  const operator = await boot.deployment(path, argv.environment)
  const variables = operator.variables()

  const envData = variables.global.reverse().map(item => `${item.name}=${item.value ?? ''}`)

  await file.write(`${path}/.env`, envData.join('\n'))
}

exports.env = env
