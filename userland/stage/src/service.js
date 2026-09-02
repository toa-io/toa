import { pathToFileURL } from 'node:url'
import * as boot from '@toa.io/boot'
import { state } from './state.js'
import { shortcuts } from '@toa.io/norm'

const service = async (ref) => {
  const path = shortcuts.resolve(ref)
  const { Factory } = await import(pathToFileURL(path).href)
  const factory = new Factory(boot)
  const service = factory.service()

  await service.connect()

  state.services.push(service)

  return service
}

export { service }
