'use strict'

const { Receiver, Locator } = require('@toa.io/core')

const boot = require('./index')
const extensions = require('./extensions')

const receivers = async (manifest, component) => {
  if (manifest.receivers === undefined) return []

  const receivers = []
  const local = await boot.remote(manifest.locator, undefined, manifest)

  for (const [label, definition] of Object.entries(manifest.receivers)) {
    const locator = Locator.parse(label)
    const source = definition.source ? Locator.parse(definition.source) : locator
    const event = label.split('.').pop()
    const destination = `${source.id}.${event}`

    // the origin of the calls this receiver makes to its local operation
    const origin = { namespace: source.namespace, component: source.name, event }

    const bridge = definition.bridge !== undefined ? boot.bridge.receiver(definition.bridge, manifest.path, label) : undefined
    const receiver = new Receiver({ ...definition, label, destination, origin }, local, bridge)
    const decorator = extensions.receiver(receiver, manifest.locator)

    const transport = definition.binding ?? await resolveBinding(locator, label)
    const binding = boot.bindings.receive(transport, source, label, manifest.locator.id, decorator)

    binding.depends(component)
    receivers.push(binding)
  }

  return receivers
}

async function receive (label, group, callback) {
  if (callback === undefined) {
    callback = group
    group = undefined
  }

  const locator = Locator.parse(label)
  const transport = await resolveBinding(locator, label)

  return boot.bindings.receive(transport, locator, label, group, callback)
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
exports.receive = receive
