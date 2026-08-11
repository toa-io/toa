import type { Call, Operation } from '@toa.io/types'

export class Computation implements Operation {
  private basic: Basic = undefined as unknown as Basic
  private federation: Federation = undefined as unknown as Federation
  private passkeys: Passkeys = undefined as unknown as Passkeys

  public mount (context: Context): void {
    this.basic = context.remote.identity.basic
    this.federation = context.remote.identity.federation

    this.passkeys = context.remote.identity.passkeys
  }

  public async execute (input: Input): Promise<Output> {
    const request = { input }

    const [basic, federationObjects, passkeyObjects] = await Promise.all([
      this.basic.info(request),
      this.federation.list(request),
      this.passkeys.list(request)
    ])

    const federation = federationObjects.map(({ id, iss, _created }) => ({ id, iss, _created }))

    const passkeys = passkeyObjects.map(({ id, aid, synced, label, _created }) => ({
      id,
      aid,
      synced,
      label,
      _created
    }))

    return { basic, federation, passkeys }
  }
}

interface Input {
  authority: string
  identity: string
}

interface BasicCredential {
  username: string
}

interface FederationCredential {
  id: string
  iss: string
  _created: number
}

interface PasskeyCredential {
  id: string
  aid: string
  synced: boolean
  label?: string
  _created: number
}

interface Output {
  basic: BasicCredential | null
  federation: FederationCredential[]
  passkeys: PasskeyCredential[]
}

interface Context {
  remote: {
    identity: {
      basic: Basic
      federation: Federation
      passkeys: Passkeys
    }
  }
}

interface Basic {
  info: Call<BasicCredential | null, Input>
}

interface Federation {
  list: Call<FederationCredential[], Input>
}

interface Passkeys {
  list: Call<PasskeyCredential[], Input>
}
