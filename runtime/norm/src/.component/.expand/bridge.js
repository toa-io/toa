import { resolve } from '../../shortcuts.js'

function bridge (manifest) {
  manifest.bridge = resolve(manifest.bridge)
}

export { bridge }
