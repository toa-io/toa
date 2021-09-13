'use strict'

const { Locator, Discovery, Transmission } = require('@kookaburra/core')

const boot = require('./index')

const discovery = (fqn) => {
  const manifest = { ...Locator.split(fqn) }
  const locator = new Locator(manifest)
  const consumers = boot.bindings.discover(locator)
  const transmission = new Transmission({ name: 'discover' }, consumers)

  return new Discovery(transmission)
}

exports.discovery = discovery
