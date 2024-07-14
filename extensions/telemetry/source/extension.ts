import { Logs } from './Logs'
import type { Locator, extensions } from '@toa.io/core'

export class Factory implements extensions.Factory {
  public aspect (locator: Locator, manifest: any): extensions.Aspect[] {
    const logs = new Logs(locator)

    return [logs]
  }
}

export const ID = 'telemetry'
