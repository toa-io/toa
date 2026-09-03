import { resolve } from '../../shortcuts.js'

export function receivers (manifest) {
  if (manifest.receivers === undefined) return

  for (const [locator, receiver] of Object.entries(manifest.receivers)) {
    if (typeof receiver === 'string') manifest.receivers[locator] = { operation: receiver }

    if (receiver.binding !== undefined) receiver.binding = resolve(receiver.binding)
    if (receiver.bridge !== undefined) receiver.bridge = resolve(receiver.bridge)
  }
}
