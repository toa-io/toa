import * as boot from './index.js'

async function rc (manifest, context) {
  return boot.bridge.rc(manifest.bridge, manifest.path, context)
}

export { rc }
