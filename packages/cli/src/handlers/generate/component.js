'use strict'

const fs = require('fs-extra')

const { Package } = require('@kookaburra/package')
const { tryRoot } = require('../../util/root')

const { manifest } = require('./manifest')
const { operation } = require('./operation')

async function component ({ name, operations }) {
  const dir = tryRoot()

  if (dir) {
    const component = await Package.load(dir)
    throw new Error(`Can't generate component inside component '${component.manifest.name}'`)
  }

  if (await fs.pathExists(name)) {
    throw new Error(`${name} already exists`)
  }

  await fs.mkdirp(name)
  console.info(`${name} directory created`)

  process.chdir(name)

  await manifest({ name })

  if (operations) { await Promise.all(operations.map(name => operation({ name }))) }
}

exports.component = component
