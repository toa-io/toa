'use strict'

const { Receiver, Locator } = require('@toa.io/core')

const boot = require('./index')

const receivers = async (manifest) => {
  if (manifest.receivers === undefined) return []

  const receivers = []

  for (const [label, definition] of Object.entries(manifest.receivers)) {
    const local = await boot.remote(manifest.locator.id)
    const bridge = boot.bridge.receiver(definition.bridge, manifest.path, label)
    const receiver = new Receiver(definition, local, bridge)

    let transport = definition.binding
    const locator = new Locator(label)
    const { endpoint } = Locator.parse(label)

    if (transport === undefined) {
      const discovery = await boot.discovery.discovery()
      const { events } = await discovery.lookup(locator.id)

      transport = events[endpoint].binding
    }

    const { id } = new Locator(manifest)
    const binding = boot.bindings.receive(transport, locator, endpoint, id, receiver)

    receivers.push(binding)
  }

  return receivers
}

exports.receivers = receivers
