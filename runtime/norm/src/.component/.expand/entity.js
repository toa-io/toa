import { resolve } from '../../shortcuts.js'

export function entity (manifest) {
  if (!('entity' in manifest)) return

  manifest.entity.storage = resolve(manifest.entity.storage)
}
