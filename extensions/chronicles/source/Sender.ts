import { current, encode } from 'openspan'
import { Connector, Locator, entities, exceptions } from '@toa.io/core'
import { FACTS, NAMESPACE } from '@toa.io/definitions/extensions.chronicles'
import type { Row } from './Provider.ts'
import type { Remote } from '@toa.io/core'
import type { extensions } from '@toa.io/core/types'

/**
 * `context.chronicles.send(name, payload)` — a fact that changes no state, written under
 * `<component>.<name>`. It is a task to the component that writes facts, so it resolves once the
 * broker has it, and is kept until that component takes it.
 */
export class Sender extends Connector {
  public readonly name = 'chronicles'

  private readonly host: extensions.Host
  private readonly locator: Locator
  private remote?: Promise<Remote>

  public constructor(host: extensions.Host, locator: Locator) {
    super()

    this.host = host
    this.locator = locator
  }

  // named rather than forwarded, so that the connector's lifecycle is not reachable from an
  // algorithm
  public async invoke(method: string, ...args: any[]): Promise<void> {
    if (method !== 'send')
      throw new exceptions.MisuseException(`Chronicles have no '${method}'`)

    await this.send(args[0], args[1])
  }

  private async send(name: unknown, payload: unknown): Promise<void> {
    if (typeof name !== 'string' || !NAME.test(name))
      throw new exceptions.MisuseException(
        `A chronicle is named by segments of letters and digits separated by dots, not '${String(name)}'`
      )

    if (
      payload !== undefined &&
      (typeof payload !== 'object' || payload === null || Array.isArray(payload))
    )
      throw new exceptions.MisuseException('The payload of a chronicle is an object')

    const context = current()

    const row: Row = {
      id: entities.newid(),
      label: `${this.locator.id}.${name}`,
      component: this.locator.id,
      time: Date.now(),
      entity: null,
      version: null,
      trace: context === undefined ? null : encode(context),
      payload: payload ?? {}
    }

    const remote = await this.facts()

    await remote.invoke('record', { input: row, task: true })
  }

  /**
   * Resolved on the first fact and not before: an aspect is made ahead of the components of its
   * composition, and one that could not be found is looked for again by the next fact.
   */
  private async facts(): Promise<Remote> {
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

const LOCATOR = new Locator(FACTS, NAMESPACE)
const SOURCE = { service: 'chronicles' }
const NAME = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/
