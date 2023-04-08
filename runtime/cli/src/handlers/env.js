'use strict'

const { join } = require('node:path')
const boot = require('@toa.io/boot')
const { context: find } = require('../util/find')
const { file } = require('@toa.io/filesystem')

async function env (argv) {
  const path = find(argv.path)
  const operator = await boot.deployment(path, argv.environment)
  const variables = operator.variables()
  const lines = variables.global.map((variable) => `${variable.name}=${variable.value ?? ''}`)
  const contents = lines.join('\n')
  const filepath = join(path, '.env')

  await file.write(filepath, contents)
}

exports.env = env
