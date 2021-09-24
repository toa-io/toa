'use strict'

const { Locator, Discovery, Transmission } = require('@kookaburra/core')

const boot = require('./index')

let instance

const discovery = async () => {
  if (instance === undefined) {
    const locator = new Locator()
    const consumers = boot.bindings.discover(locator)
    const transmission = new Transmission.Dynamic(consumers)

    instance = new Discovery(transmission)

    await instance.connect()
  }

  return instance
}

exports.discovery = discovery
