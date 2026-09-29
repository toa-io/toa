import { exceptions } from '@toa.io/core'
import { NAMESPACE } from '@toa.io/definitions/extensions.continuity'
import { Composition } from './Composition.ts'
import { Journal } from './Journal.ts'
import { Run } from './Run.ts'
import type { Component, Connector, Context, Locator } from '@toa.io/core'
import type { Declaration } from '@toa.io/definitions/extensions.continuity'
import type { extensions, Options, Request } from '@toa.io/core/types'

export class Factory implements extensions.Factory {
  private readonly host: extensions.Host

  /** what each component declared, by its locator: the hooks that wrap it are handed no more */
  private readonly declared: Record<string, Declaration> = {}

  private journal?: Journal

  public constructor(host: extensions.Host) {
    this.host = host
  }

  /**
   * Nothing is put on the context: this is where a component's declaration is handed over, ahead
   * of the context and the component being built.
   */
  public aspect(locator: Locator, declaration: Declaration): extensions.Aspect[] {
    if (!mine(locator)) this.declared[locator.id] = declaration

    return []
  }

  public component(component: Component): Component {
    const declaration = this.declared[component.locator.id]

    if (declaration === undefined) return component

    const journal = this.connected(component)
    const invoke = component.invoke.bind(component)

    component.invoke = async (
      endpoint: string,
      request?: Request,
      options?: Options
    ): Promise<any> => {
      const window = declaration[endpoint]

      if (window === undefined) return await invoke(endpoint, request, options)

      const refusal = refuse(component, endpoint, request)

      if (refusal !== undefined) return { exception: refusal }

      let run: Run

      try {
        run = await Run.begin(request!.id!, journal, window)
      } catch (exception) {
        return { exception: coded(exception) }
      }

      const reply = await run.within(async () => await invoke(endpoint, request, options))

      // what was taken without waiting is kept before the attempt is done with
      try {
        await run.settle()
      } catch (exception) {
        return { exception: coded(exception) }
      }

      return reply
    }

    return component
  }

  public context(context: Context): Context {
    if (context.locator === undefined || this.declared[context.locator.id] === undefined)
      return context

    continued(context)

    return context
  }

  // nothing connects to this, so a halt takes the whole of it
  public service(): Connector {
    return this.host.gate(async () => new Composition(this.host))
  }

  /** one journal for the process, which the component it serves goes down with */
  private connected(component: Component): Journal {
    if (this.journal === undefined || this.journal.disposed)
      this.journal = new Journal(this.host)

    component.depends(this.journal)

    return this.journal
  }
}

/**
 * The members of the context that answer an operation, each made a step of the run where there is
 * one, and left alone where there is none. What is no step — a log, a span, a metric, the
 * configuration, a process's own state and what its replicas decide — is not touched.
 */
function continued(context: Context): void {
  const call = context.call.bind(context)
  const apply = context.apply.bind(context)
  const newid = context.newid.bind(context)
  const now = context.now.bind(context)
  const random = context.random.bind(context)

  // eslint-disable-next-line max-params
  context.call = async (namespace, name, endpoint, request, options) => {
    const run = Run.current()

    if (run === undefined) return await call(namespace, name, endpoint, request, options)

    return await run.step(`call:${namespace}.${name}.${endpoint}`, [request], (id) =>
      call(namespace, name, endpoint, identified(request, id), options)
    )
  }

  context.apply = async (endpoint, request, options) => {
    const run = Run.current()

    if (run === undefined) return await apply(endpoint, request, options)

    return await run.step(`apply:${endpoint}`, [request], (id) =>
      apply(endpoint, identified(request, id), options)
    )
  }

  context.newid = () => Run.current()?.value('newid', newid) ?? newid()
  context.now = () => Run.current()?.value('now', now) ?? now()
  context.random = () => Run.current()?.value('random', random) ?? random()

  const aspects = context.aspects

  for (let i = 0; i < aspects.length; i++) {
    const aspect = aspects[i]

    if (PASSED.has(aspect.name)) continue

    const invoke = aspect.invoke.bind(aspect)

    // what the bridge reads of an aspect is its name and `invoke`, and the aspect itself stays a
    // dependency of the context as it was
    aspects[i] = {
      name: aspect.name,
      invoke: (...args: unknown[]) => {
        const run = Run.current()

        if (run === undefined) return invoke(...args)

        return run.step(`aspect:${aspect.name}`, args, async () => await invoke(...args))
      }
    } as extensions.Aspect
  }
}

/**
 * A call made as a step carries the identity its key derives, so that it arrives under the same one
 * on every attempt. The request is copied rather than written to: one request object may be handed
 * to more than one call.
 */
function identified(request: Request | undefined, id: string): Request {
  return { ...request, id: request?.id ?? id }
}

/**
 * A run is known by the identity a task or an event carries on every attempt. A caller that waits
 * retries by itself, under an identity of its own, and a run of it would not be one run.
 */
function refuse(
  component: Component,
  endpoint: string,
  request: Request | undefined
): exceptions.Exception | undefined {
  const target = `'${component.locator.id}.${endpoint}'`

  if (request?.task !== true && !delivered(request))
    return new exceptions.RequestContractException(
      `${target} is continued, and runs as a task or for an event, which nobody waits for`
    )

  if (typeof request!.id !== 'string' || !IDENTITY.test(request!.id))
    return new exceptions.RequestContractException(
      `${target} is continued, and a request that carries no identity has no run to continue`
    )

  return undefined
}

/** whether a receiver handed this request on, which is the last hop its chain names */
function delivered(request: Request | undefined): boolean {
  const hops = request?.trail

  return Array.isArray(hops) && hops.at(-1)?.startsWith('~') === true
}

function coded(exception: unknown): exceptions.Exception {
  if (typeof (exception as { code?: unknown })?.code === 'number')
    return exception as exceptions.Exception

  return new exceptions.SystemException(exception as Error)
}

/** Whether this is a component the extension ships rather than one of the application's. */
function mine(locator: Locator): boolean {
  return locator.namespace === NAMESPACE
}

const PASSED = new Set(['logs', 'span', 'metrics', 'configuration', 'state', 'atom'])

// what a run is looked up by in the journal's criteria, so nothing it could hold is quoted
const IDENTITY = /^[0-9A-Za-z_-]{1,128}$/

export type Host = extensions.Host
