'use strict'

const fs = require('fs-extra')
const path = require('path')

const { root } = require('../../util/root')

async function operation ({ name, transition }) {
  let type = transition ? 'transition' : 'observation'

  if (name[name.length - 1] === '!') {
    name = name.substr(0, name.length - 1)
    type = 'transition'
  }

  const dir = path.resolve(root(), OPERATIONS_DIR)
  await fs.mkdirp(dir)

  const template = path.resolve(__dirname, `./templates/${type}.js`)
  const target = path.resolve(dir, `${name}.js`)

  if (await fs.pathExists(target)) { throw new Error(`Operation '${name}' already exists`) }

  await fs.copy(template, target)

  console.info(`Operation ${name} (${type}) created`)
}

const OPERATIONS_DIR = 'operations'

exports.operation = operation
