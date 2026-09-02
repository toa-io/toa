import { recognize } from '../../shortcuts.js'

function properties (manifest) {
  recognize(SHORTCUTS, manifest, 'properties')
  recognize(SHORTCUTS, manifest.properties)
}

const SHORTCUTS = {
  queues: '@toa.io/storages.queues'
}

export { properties }
