import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as boot from '@toa.io/boot'
import { state } from './state.js'
import { shortcuts } from '@toa.io/norm'

// a shortcut resolves to a package name, which is not a path
const require = createRequire(import.meta.url)

const service = async (ref) => {
  const path = shortcuts.resolve(ref)
  const { Factory } = await import(pathToFileURL(require.resolve(path)).href)
  const factory = new Factory(boot)
  const service = await factory.service()

  await service.connect()

  state.services.push(service)

  return service
}

export { service }
