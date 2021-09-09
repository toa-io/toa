'use strict'

const boot = require('./index')

const remote = async (name) => {
  const discovery = boot.discovery(name)

  await discovery.connect()

  const locator = await discovery.discover()

  // TODO: call requires entity, entity requires schema
  // schema is required
  // how is schema passed via discovery?
  // reconsider parsing query in Operation
  // Option: extend Locator
  // entity -> name
  // name -> absolute
  // entity -> manifest.entity.schema
  // const calls = locator.endpoints.map(boot.call)

  return { remote: name, locator }
}

exports.remote = remote
