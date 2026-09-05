import { Connector, Locator } from '@toa.io/core'
import { Composition } from './Composition.js'
import { COMPONENT, NAMESPACE } from './const.js'
import { Aspect } from './Aspect.js'
import { Dispatcher } from './Dispatcher.js'
import { Local } from './Local.js'
import { Pulse } from './Pulse.js'
import type { Declaration } from './types.js'
import type { extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  private readonly host: Host

  /** one per component, however much of this extension calls through it */
  private readonly locals: Record<string, Local> = {}

  public constructor (host: Host) {
    this.host = host
  }

  /**
   * What runs beside a component. Its own component gets the dispatcher; everyone else gets a
   * timer per operation they declared a cadence for.
   *
   * A tenant is created before the components of its composition are, which is why nothing here
   * reaches for one.
   */
  public tenant (locator: Locator, declaration: object): Connector {
    if (mine(locator))
      return new Dispatcher(this.metronome(), (target) => this.local(target),
        this.host.atom(locator.id))

    const tenant = new Connector()
    const pulses = declaration as Declaration | null

    // `cadence: ~` is a component that only delays calls
    if (pulses === null) return tenant

    const local = this.local(locator)
    const atom = this.host.atom(locator.id)

    for (const [endpoint, { cycle, intervals }] of Object.entries(pulses))
      tenant.depends(new Pulse({ locator, endpoint, cycle, intervals }, local, atom))

    return tenant
  }

  /** `context.delay` — for every component but the one that keeps the calls. */
  public aspect (locator: Locator): extensions.Aspect | extensions.Aspect[] {
    if (mine(locator)) return []

    return new Aspect(this.metronome())
  }

  public service (): Connector {
    return new Composition(this.host)
  }

  private metronome (): Local {
    return this.local(new Locator(COMPONENT, NAMESPACE))
  }

  private local (locator: Locator): Local {
    return (this.locals[locator.id] ??= new Local(this.host, locator))
  }
}

/** Whether this is a component the extension ships rather than one of the application's. */
function mine (locator: Locator): boolean {
  return locator.namespace === NAMESPACE
}

export type Host = extensions.Host
