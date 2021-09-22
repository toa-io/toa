'use strict'

const { Locator, Discovery, Transmission } = require('@kookaburra/core')

const boot = require('./index')

const discovery = (fqn, bindings) => {
  const manifest = { ...Locator.split(fqn) }
  const locator = new Locator(manifest)
  const consumers = boot.bindings.discover(locator, bindings)
  const transmission = new Transmission('discover', consumers)

  return new Discovery(transmission)
}

exports.discovery = discovery
