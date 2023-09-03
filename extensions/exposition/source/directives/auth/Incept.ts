import { type Directive, type Discovery, type Identity, type Input, type Schemes } from './types'
import { split } from './split'
import { PROVIDERS } from './schemes'
import type * as http from '../../HTTP'

export class Incept implements Directive {
  private readonly property: string
  private readonly discovery: Discovery
  private readonly schemes: Schemes = {} as unknown as Schemes

  public constructor (property: string, discovery: Discovery) {
    this.property = property
    this.discovery = discovery
  }

  public authorize (identity: Identity | null, input: Input): boolean {
    return identity === null && 'authorization' in input.headers
  }

  public async settle (request: Input, response: http.OutgoingMessage): Promise<void> {
    const id = response.body?.output?.[this.property]

    if (id === undefined)
      throw new Error('Identity inception failed as the response body does not contain ' +
        `the '${this.property}' property.`)

    const [scheme, credentials] = split(request.headers.authorization as string)
    const provider = PROVIDERS[scheme]

    this.schemes[scheme] ??= await this.discovery[provider]

    const reply = await this.schemes[scheme].invoke('create', { input: { id, credentials } })

    request.identity = reply.output as Identity
    request.identity.scheme = scheme
  }
}