import { Connector } from '@toa.io/core'
import { DISABLED, environment, component as declaration, settings } from './annotation.js'
import { NAMESPACE, UI_PORT } from './const.js'
import { describe } from './describe.js'
import { Reporter } from './Reporter.js'
import { Tenant } from './Tenant.js'
import { Composition } from './Composition.js'
import { Explorer } from './Explorer.js'
import { UI } from './UI.js'
import { capture, samplable } from './sample.js'
import type { Declaration, Options, Settings } from './annotation.js'
import type { Origin, Outcome, Target } from './model.js'
import type { Manifest } from '@toa.io/norm'
import type { Component, Locator } from '@toa.io/core'
import type { Reply, Request, extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  private readonly host: Host
  private readonly options: Options | null
  private readonly settings: Record<string, Settings> = {}
  private reporter: Reporter | null = null

  public constructor (host: Host) {
    this.host = host
    this.options = environment()
  }

  public tenant (locator: Locator, decl: Declaration | null, manifest: Manifest): Connector {
    const resolved = settings(locator.namespace!, declaration(decl), this.options)

    this.settings[locator.id] = resolved

    if (!resolved.enabled || locator.namespace === NAMESPACE)
      return new Connector()

    return new Tenant(this.collector(), describe(manifest))
  }

  public component (component: Component): Component {
    const locator = component.locator
    const resolved = this.resolve(locator)

    if (!resolved.enabled)
      return component

    const reporter = this.collector()
    const invoke = component.invoke.bind(component)

    component.invoke = async (endpoint: string, request: Request): Promise<any> => {
      let outcome: Outcome = 'ok'
      let reply: Reply | undefined

      try {
        reply = await invoke(endpoint, request)

        if (reply?.exception !== undefined) outcome = 'exception'
        else if (reply?.error !== undefined) outcome = 'error'

        return reply
      } catch (error) {
        outcome = 'exception'

        throw error
      } finally {
        // a call that failed is still a connection between two components
        const src: Origin = request?.source ?? UNKNOWN
        const dst: Target =
          { namespace: locator.namespace!, component: locator.name, operation: endpoint }

        const sample = resolved.samples && samplable(request?.input)
          ? capture(request?.input, outcome)
          : undefined

        reporter.observe({ src, dst, sample })
      }
    }

    component.depends(reporter)

    return component
  }

  public service (): Connector | null {
    if (this.options === null)
      return null

    const composition = new Composition(this.host)
    const explorer = new Explorer()

    explorer.depends(composition)

    if (this.options.ui)
      explorer.depends(new UI(UI_PORT))

    return explorer
  }

  /**
   * `tenant()` runs before any component is created, so settings are warm.
   * A component booted on its own (without a composition) falls back to
   * the environment, with sampling off.
   */
  private resolve (locator: Locator): Settings {
    if (locator.namespace === NAMESPACE)
      return DISABLED

    return this.settings[locator.id] ??
      settings(locator.namespace!, {},
        this.options === null ? null : { ...this.options, samples: false })
  }

  private collector (): Reporter {
    this.reporter ??= new Reporter(this.host, this.options!)

    return this.reporter
  }
}

const UNKNOWN = { service: 'unknown' } as const

export type Host = extensions.Host
