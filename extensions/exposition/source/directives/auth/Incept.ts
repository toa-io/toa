import { type Maybe } from '@toa.io/types'
import * as http from '../../HTTP'
import { type Directive, type Discovery, type Identity, type Input, type Schemes } from './types'
import { split } from './split'
import { PROVIDERS } from './schemes'

export class Incept implements Directive {
  private readonly property: string
  private readonly discovery: Discovery
  private readonly schemes: Schemes = {} as unknown as Schemes

  public constructor (property: string, discovery: Discovery) {
    this.property = property
    this.discovery = discovery
  }

  public authorize (identity: Identity | null, input: Input): boolean {
    return identity === null && 'authorization' in input.request.headers
  }

  public async settle (input: Input, response: http.OutgoingMessage): Promise<void> {
    const id = response.body?.[this.property]

    if (id === undefined)
      throw new http.Conflict('Identity inception has failed as the response body ' +
        `does not contain the '${this.property}' property.`)

    const [scheme, credentials] = split(input.request.headers.authorization!)
    const provider = PROVIDERS[scheme]

    this.schemes[scheme] ??= await this.discovery[provider]

    const identity = await this.schemes[scheme]
      .invoke<Maybe<Identity>>('incept', {
      input: {
        authority: input.authority,
        id,
        credentials
      }
    })

    if (identity instanceof Error)
      throw new http.UnprocessableEntity(identity)

    input.identity = identity
    input.identity.scheme = scheme
  }
}
