import { Connector } from '@toa.io/core'
import {
  DISABLED,
  environment,
  component as declaration,
  settings
} from '@toa.io/definitions/extensions.introspection'
import { NAMESPACE, uiPort } from '@toa.io/definitions/extensions.introspection'
import { describe } from './describe.ts'
import { Reporter } from './Reporter.ts'
import { Tenant } from './Tenant.ts'
import { Composition } from './Composition.ts'
import { Explorer } from './Explorer.ts'
import { UI } from './UI.ts'
import { capture, samplable } from './sample.ts'
import type {
  Declaration,
  Options,
  Settings
} from '@toa.io/definitions/extensions.introspection'
import type { Origin, Outcome, Target } from './model.ts'
import type { Manifest } from '@toa.io/norm'
import type { Component, Locator } from '@toa.io/core'
import type { Reply, Request, extensions } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  private readonly host: Host
  private readonly options: Options | null
  private readonly settings: Record<string, Settings> = {}
  private reporter: Reporter | null = null

  public constructor(host: Host) {
    this.host = host
    this.options = environment()
  }

  public tenant(
    locator: Locator,
    decl: Declaration | null,
    manifest: Manifest
  ): Connector {
    const resolved = settings(locator.namespace!, declaration(decl), this.options)

    this.settings[locator.id] = resolved

    if (!resolved.enabled || locator.namespace === NAMESPACE) return new Connector()

    return new Tenant(this.collector(), describe(manifest))
  }

  public component(component: Component): Component {
    const locator = component.locator
    const resolved = this.resolve(locator)

    if (!resolved.enabled) return component

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
        const src: Origin = origin(request?.source)
        const dst: Target = {
          namespace: locator.namespace!,
          component: locator.name,
          operation: endpoint
        }

        const sample =
          resolved.samples && samplable(request?.input)
            ? capture(request?.input, outcome)
            : undefined

        reporter.observe({ src, dst, sample })
      }
    }

    component.depends(reporter)

    return component
  }

  public service(): Connector | null {
    if (this.options === null) return null

    const composition = new Composition(this.host)
    const explorer = new Explorer()

    explorer.depends(composition)

    if (this.options.ui) explorer.depends(new UI(uiPort()))

    return explorer
  }

  /**
   * `tenant()` runs before any component is created, so settings are warm.
   * A component booted on its own (without a composition) falls back to
   * the environment, with sampling off.
   */
  private resolve(locator: Locator): Settings {
    if (locator.namespace === NAMESPACE) return DISABLED

    return (
      this.settings[locator.id] ??
      settings(
        locator.namespace!,
        {},
        this.options === null ? null : { ...this.options, samples: false }
      )
    )
  }

  /**
   * One collector per process — and per build of its tree. A reporter that went with a tree
   * that has been taken down holds remotes that are gone: it would answer that it is ready,
   * dispatch into nothing, and say so at `debug` alone.
   */
  private collector(): Reporter {
    if (this.reporter === null || this.reporter.disposed)
      this.reporter = new Reporter(this.host, this.options!)

    return this.reporter
  }
}

const UNKNOWN = { service: 'unknown' } as const

/**
 * `source` crosses the wire, and what it names is stored as an edge of the map — so what is
 * read off it is the keys this release knows, and never whatever a peer put beside them.
 */
function origin(source: Origin | undefined): Origin {
  if (source === undefined) return UNKNOWN

  if ('service' in source) return { service: source.service }

  return 'event' in source
    ? { namespace: source.namespace, component: source.component, event: source.event }
    : {
        namespace: source.namespace,
        component: source.component,
        operation: source.operation
      }
}

export type Host = extensions.Host
