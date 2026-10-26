import { current, encode } from 'openspan'
import { Connector, Locator, entities, exceptions } from '@toa.io/core'
import { NAMESPACE, RELAY } from '@toa.io/definitions/extensions.chronicles'
import { Mismatch, project } from './contract.ts'
import type { Row } from './Provider.ts'
import type { Contract } from '@toa.io/definitions/extensions.chronicles'
import type { Remote } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

/**
 * `context.chronicles.send(name, payload, { identity })` — a fact that changes no state, written under
 * `<component>.<name>`, of which what the component declares of it is sent. It is a task to the
 * component that writes facts, so it resolves once the broker has it, and is kept until that
 * component takes it.
 */
export class Sender extends Connector {
  public readonly name = 'chronicles'

  private readonly host: extensions.Host
  private readonly locator: Locator
  private readonly facts: Record<string, Contract>
  private remote?: Promise<Remote>

  /** `facts` are the contracts of the facts the component declares, by name */
  public constructor(
    host: extensions.Host,
    locator: Locator,
    facts: Record<string, Contract>
  ) {
    super()

    this.host = host
    this.locator = locator
    this.facts = facts
  }

  // named rather than forwarded, so that the connector's lifecycle is not reachable from an
  // algorithm
  public async invoke(method: string, ...args: any[]): Promise<void> {
    if (method !== 'send')
      throw new exceptions.MisuseException(`Chronicles have no '${method}'`)

    await this.send(args[0], args[1], args[2])
  }

  private async send(name: unknown, payload: unknown, options?: Options): Promise<void> {
    if (typeof name !== 'string' || !NAME.test(name))
      throw new exceptions.MisuseException(
        `A chronicle is named by segments of letters and digits separated by dots, not '${String(name)}'`
      )

    if (
      payload !== undefined &&
      (typeof payload !== 'object' || payload === null || Array.isArray(payload))
    )
      throw new exceptions.MisuseException('The payload of a chronicle is an object')

    const contract = this.facts[name]

    if (contract === undefined)
      throw new exceptions.MisuseException(
        `'${this.locator.id}' declares no fact '${name}'`
      )

    const context = current()

    const row: Row = {
      id: entities.newid(),
      label: `${this.locator.id}.${name}`,
      component: this.locator.id,
      time: Date.now(),
      entity: null,
      version: null,
      identity: typeof options?.identity === 'string' ? options.identity : null,
      trace: context === undefined ? null : encode(context),
      payload: declared(name, payload ?? {}, contract)
    }

    const remote = await this.recorder()

    await remote.invoke('record', { input: row, task: true })
  }

  /**
   * Resolved on the first fact and not before: an aspect is made ahead of the components of its
   * composition, and one that could not be found is looked for again by the next fact.
   */
  private async recorder(): Promise<Remote> {
    this.remote ??= (async () => {
      const remote = await this.host.remote(LOCATOR, SOURCE)

      this.depends(remote)
      await remote.connect()

      return remote
    })().catch((error: unknown) => {
      this.remote = undefined

      throw error
    })

    return await this.remote
  }
}

/** What the contract declares of the payload of a fact; one it does not admit is not sent. */
function declared(name: string, payload: object, contract: Contract): object {
  try {
    return project(payload, contract.properties)
  } catch (exception) {
    if (exception instanceof Mismatch)
      throw new exceptions.MisuseException(
        `The fact '${name}' is not what its chronicles declare: ${exception.message}`
      )

    throw exception
  }
}

/** What a fact is said to be of: the operation knows whose it is, the extension does not. */
interface Options {
  identity?: string
}

const LOCATOR = new Locator(RELAY, NAMESPACE)
const SOURCE = { service: 'chronicles' }
const NAME = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/
