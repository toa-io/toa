import assert from 'node:assert'
import { Receiver, Locator } from '@toa.io/core'

import * as boot from './index.js'
import * as extensions from './extensions/index.js'

export const receivers = async (manifest, component) => {
  if (manifest.receivers === undefined) return []

  const receivers = []
  const local = await boot.remote(manifest.locator, undefined, { contract: manifest })

  for (const [label, definition] of Object.entries(manifest.receivers)) {
    const locator = Locator.parse(label)
    const source = definition.source ? Locator.parse(definition.source) : locator
    const event = label.split('.').pop()
    const destination = `${source.id}.${event}`

    // the origin of the calls this receiver makes to its local operation
    const origin = { namespace: source.namespace, component: source.name, event }

    const bridge =
      definition.bridge !== undefined
        ? await boot.bridge.receiver(definition.bridge, manifest.path, label)
        : undefined
    const receiver = new Receiver(
      { ...definition, label, destination, origin },
      local,
      bridge
    )
    const decorator = extensions.receiver(receiver, manifest.locator)

    const transport = definition.binding ?? (await resolveBinding(locator, label))
    const binding = await boot.bindings.receive(
      transport,
      source,
      label,
      manifest.locator.id,
      decorator
    )

    binding.depends(component)
    receivers.push(binding)
  }

  return receivers
}

export async function receive(label, group, callback) {
  if (callback === undefined) {
    callback = group
    group = undefined
  }

  const locator = Locator.parse(label)
  const transport = await resolveBinding(locator, label)

  return await boot.bindings.receive(transport, locator, label, group, callback)
}

/**
 * Which transport carries an event, as the component whose event it is declares it.
 *
 * @param {import('@toa.io/core').Locator} locator
 * @param {string} label
 * @return {Promise<string>}
 */
async function resolveBinding(locator, label) {
  const event = label.split('.').pop()
  const contract = await boot.map.contract(locator.id)

  assert.ok(
    contract !== undefined,
    `The component map states nothing of '${locator.id}', whose event '${label}' receives. ` +
      'Run `toa map`.'
  )

  const { events, version } = contract

  assert.ok(
    events?.[event] !== undefined,
    `'${locator.id}'${version === undefined ? '' : ` at version ${version}`} declares no ` +
      `event '${event}', which is what '${label}' receives`
  )

  return events[event].binding
}
