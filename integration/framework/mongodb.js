'use strict'

const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

const connect = async (id) => {
  const [namespace, name] = id.split('.')
  const locator = new Locator(name, namespace)
  const storage = boot.storage(locator, '@toa.io/storages.mongodb')

  await storage.connect()

  return storage
}

exports.connect = connect
