import { resolve } from '../../shortcuts.js'

function entity (manifest) {
  if (!('entity' in manifest)) return

  manifest.entity.storage = resolve(manifest.entity.storage)
}

export { entity }
