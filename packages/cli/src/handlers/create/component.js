'use strict'

const fs = require('fs-extra')

const { console } = require('@kookaburra/gears')
const { tryRoot } = require('../../util/root')
const { manifest } = require('./manifest')
const { operation } = require('./operation')

async function component ({ name, operations }) {
  const dir = tryRoot()

  if (dir) {
    throw new Error('Can\'t create component inside component')
  }

  if (await fs.pathExists(name)) {
    throw new Error(`Component '${name}' already exists`)
  }

  await fs.mkdirp(name)
  console.info(`Directory '${name}' created`)

  process.chdir(name)

  await manifest({ name })

  if (operations) { await Promise.all(operations.map(name => operation({ name }))) }
}

exports.component = component
