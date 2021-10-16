'use strict'

const { Apply, Receiver, Locator } = require('@toa.io/core')

const boot = require('./index')

const receivers = async (manifest, runtime) => {
  if (manifest.receivers === undefined) return []

  const receivers = []

  for (const [label, definition] of Object.entries(manifest.receivers)) {
    const transition = manifest.operations[definition.transition]
    const contract = boot.contract.request(transition)
    const apply = new Apply(runtime, definition.transition, contract)
    const bridge = boot.bridge.receiver(definition.bridge, manifest.path, label)
    const receiver = new Receiver(definition, apply, bridge)

    let transport = definition.binding
    const locator = new Locator(label)
    const { endpoint } = Locator.parse(label)

    if (transport === undefined) {
      const explorer = await boot.discovery.explore(locator.id)
      const { events } = await explorer.lookup()

      transport = events[endpoint].binding
    }

    const { id } = new Locator(manifest)
    const binding = boot.bindings.receive(transport, locator, endpoint, id, receiver)

    receivers.push(binding)
  }

  return receivers
}

exports.receivers = receivers
