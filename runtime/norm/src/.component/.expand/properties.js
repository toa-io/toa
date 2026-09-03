import { recognize } from '../../shortcuts.js'

export function properties (manifest) {
  recognize(SHORTCUTS, manifest, 'properties')
  recognize(SHORTCUTS, manifest.properties)
}

const SHORTCUTS = {
  queues: '@toa.io/storages.queues'
}
