import { once } from 'node:events'
import * as crypto from 'node:crypto'
import * as http from 'node:http'
import * as assert from 'node:assert'
import * as util from 'node:util'
import { binding, given, afterAll } from 'cucumber-tsflow'
import { Captures } from './Captures'

import type { AddressInfo } from 'node:net'

@binding([Captures])
export class IdP {
  private static server?: http.Server
  private static privateKey?: crypto.KeyObject
  private static issuer?: string

  public constructor (private readonly captures: Captures) {
  }

  @afterAll()
  public static async stop (): Promise<void> {
    if (this.server instanceof http.Server) {
      this.server.close()
      await once(this.server, 'close')
    }
  }

  @given(/local IDP is running/i)
  public async start (): Promise<void> {
    if (IdP.server instanceof http.Server) return

    // creating the key
    const {
      publicKey,
      privateKey
    } = await util.promisify(crypto.generateKeyPair)('rsa', {
      modulusLength: 2048
    })

    IdP.privateKey = privateKey

    const jwk = JSON.stringify({
      keys: [{
        use: 'sig',
        alg: 'RS256',
        ...publicKey.export({ format: 'jwk' })
      }]
    })

    const JWK_URL = '/.well-known/jwks'

    const server = http.createServer((request, response) => {
      switch (request.url) {
        case JWK_URL:
          response.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': jwk.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0'
          })
          response.end(jwk)
          break

        case '/.well-known/openid-configuration': {
          const openIdConfiguration = JSON.stringify({
            issuer: IdP.issuer,
            jwks_uri: IdP.issuer + JWK_URL,
            response_types_supported: ['id_token'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            scopes_supported: ['openid']
          })

          response.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            'Content-Length': openIdConfiguration.length
          })
          response.end(openIdConfiguration)
        }

          break

        default:
          response.writeHead(404, 'Not found')
          response.end()
      }
    })

    server.listen(44444, 'localhost')
    await once(server, 'listening')

    const address = server.address() as AddressInfo

    console.log('IdP is listening on %s:%s', address.address, address.port)
    IdP.server = server
    IdP.issuer = `http://localhost:${address.port}`
  }

  @given('the IDP token for {word} is issued')
  public async issueToken (user: string): Promise<void> {
    assert.ok(IdP.privateKey, 'IdP private key is not available')

    const jwt = [
      {
        typ: 'JWT',
        alg: 'RS256'
      },
      {
        iss: IdP.issuer,
        sub: user,
        aud: 'test',
        email: user + '@test.local',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 1000 * 60 * 5) / 1000)
      }
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
      .join('.')

    const signature = crypto.createSign('RSA-SHA256').end(jwt).sign(IdP.privateKey, 'base64url')

    const idToken = `${jwt}.${signature}`

    this.captures.set(`${user}.id_token`, idToken)
  }

  @given('the IDP {word} token for {word} is issued with following secret:')
  public async issueSymmetricToken (alg: string, user: string, secret: string): Promise<void> {
    const jwt = [
      {
        typ: 'JWT',
        alg
      },
      {
        iss: IdP.issuer,
        sub: user,
        aud: 'test',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 1000 * 60 * 5) / 1000)
      }
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
      .join('.')

    const signature = crypto.createHmac(alg.replace(/^HS(\d{3})$/, 'sha$1'), secret)
      .update(jwt)
      .digest('base64url')

    const idToken = `${jwt}.${signature}`

    this.captures.set(`${user}.id_token`, idToken)
  }
}
