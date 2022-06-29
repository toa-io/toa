'use strict'

const { Receiver, Locator } = require('@toa.io/core')

const boot = require('./index')

const receivers = async (manifest, runtime) => {
  if (manifest.receivers === undefined) return []

  const receivers = []

  for (const [label, definition] of Object.entries(manifest.receivers)) {
    const local = await boot.remote(manifest.locator, manifest)
    const bridge = boot.bridge.receiver(definition.bridge, manifest.path, label)
    const receiver = new Receiver(definition, local, bridge)

    let transport = definition.binding

    const [namespace, name, endpoint] = label.split('.')
    const remote = new Locator(name, namespace)

    if (transport === undefined) {
      const discovery = await boot.discovery.discovery()
      const { events } = await discovery.lookup(remote)

      transport = events[endpoint].binding
    }

    const { id } = new Locator(manifest.name, manifest.namespace)
    const binding = boot.bindings.receive(transport, remote, endpoint, id, receiver)

    binding.depends(runtime)
    receivers.push(binding)
  }

  return receivers
}

exports.receivers = receivers
