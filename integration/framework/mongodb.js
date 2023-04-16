'use strict'

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

const connect = async (id) => {
  const [namespace, name] = id.split('.')
  const locator = new Locator(name, namespace)

  const manifest = /** @type {toa.norm.Component} */ {
    path: process.cwd(),
    locator,
    entity: { storage: '@toa.io/storages.mongodb' }
  }

  const storage = boot.storage(manifest)

  await storage.connect()

  return storage
}

exports.connect = connect
