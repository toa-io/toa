'use strict'

const { Receiver, Locator } = require('@toa.io/core')

const boot = require('./index')
const extensions = require('./extensions')

const receivers = async (manifest, runtime) => {
  if (manifest.receivers === undefined) return []

  const receivers = []

  for (const [label, definition] of Object.entries(manifest.receivers)) {
    const local = await boot.remote(manifest.locator, manifest)
    const bridge = boot.bridge.receiver(definition.bridge, manifest.path, label)
    const receiver = new Receiver(definition, local, bridge)
    const decorator = extensions.receiver(receiver, manifest.locator)

    const locator = Locator.parse(label)
    const transport = definition.binding ?? await resolveBinding(locator, label)
    const source = definition.source ? Locator.parse(definition.source) : locator
    const binding = boot.bindings.receive(transport, source, label, manifest.locator.id, decorator)

    binding.depends(runtime)
    receivers.push(binding)
  }

  return receivers
}

/**
 * @param {toa.core.Locator} locator
 * @param {string} label
 * @return {Promise<string>}
 */
async function resolveBinding (locator, label) {
  const event = label.split('.').pop()
  const discovery = await boot.discovery.discovery()
  const { events } = await discovery.lookup(locator)

  return events[event].binding
}

exports.receivers = receivers
