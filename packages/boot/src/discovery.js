'use strict'

const { system, Locator } = require('@kookaburra/runtime')

const boot = require('./index')

const discovery = (remote) => {
  const locator = new system.Locator(Locator.split(remote))
  const consumer = boot.system.consumer(locator)

  return new system.Discovery(consumer)
}

exports.discovery = discovery
