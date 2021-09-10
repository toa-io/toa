'use strict'

const { Locator, Discovery } = require('@kookaburra/runtime')

const boot = require('./index')

const discovery = (fqn) => {
  const manifest = { ...Locator.split(fqn) }
  const locator = new Locator(manifest)
  const consumer = boot.bindings.discover(locator)

  return new Discovery(consumer)
}

exports.discovery = discovery
