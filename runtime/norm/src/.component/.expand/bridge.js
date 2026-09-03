import { resolve } from '../../shortcuts.js'

export function bridge (manifest) {
  manifest.bridge = resolve(manifest.bridge)
}
