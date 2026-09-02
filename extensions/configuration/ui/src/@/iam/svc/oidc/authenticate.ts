import { sync } from '../sync'
import * as net from '../net'
import { authenticated } from '../authenticated'
import { standard } from './standard'
import { providers, type Descriptor, type IDP } from './providers'
import { google } from './google'
import { apple } from './apple'

const vendors = { apple, google } as const

export async function authenticate(idp: IDP, identity?: string) {
  const credentials = await getCredentials(idp)

  if (credentials instanceof Error)
    return credentials

  if (identity !== undefined)
    return add(identity, credentials)
  else
    return verify(idp, credentials)
}

async function getCredentials(idp: IDP) {
  const auth = (vendors[idp] ?? standard) as Authenticate
  const descriptor = providers[idp]

  const code = await auth(descriptor, idp)

  if (code instanceof Error) {
    console.error('Authentication failed', code)

    return code
  }

  if (code === undefined)
    throw new Error('No authentication code received, redirect flow is not supported')

  const data = {
    code,
    iss: descriptor.iss,
    for: window.location.origin,
  }

  return btoa(JSON.stringify(data))
}

async function add(identity: string, credentials: string) {
  const err = await net.federation.post(identity, { scheme: 'code', credentials })

  if (err instanceof Error)
    return err

  void sync()
}

async function verify(idp: IDP, credentials: string) {
  const echo = await net.get('Code ' + credentials)

  return authenticated(echo, idp)
}

type Authenticate = (descriptor: Descriptor, idp: IDP) => Promise<string | Error | undefined>
