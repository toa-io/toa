import { once } from 'node:events'
import * as crypto from 'node:crypto'
import * as http from 'node:http'
import * as assert from 'node:assert'
import * as util from 'node:util'
import { buffer } from 'node:stream/consumers'
import { binding, given, afterAll } from 'cucumber-tsflow'
import { Captures } from './Captures'

import type { AddressInfo } from 'node:net'

@binding([Captures])
export class IDP {
  private static server?: http.Server
  private static privateKey?: crypto.KeyObject
  private static issuer?: string
  private static authCodes = new Map<string, AuthCode>()
  private readonly captures: Captures

  public constructor (captures: Captures) {
    this.captures = captures
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
    if (IDP.server instanceof http.Server) return

    // creating the key
    const {
      publicKey,
      privateKey
    } = await util.promisify(crypto.generateKeyPair)('rsa', {
      modulusLength: 2048
    })

    IDP.privateKey = privateKey

    const jwk = JSON.stringify({
      keys: [{
        use: 'sig',
        alg: 'RS256',
        ...publicKey.export({ format: 'jwk' })
      }]
    })

    const JWK_ENDPOINT = '/.well-known/jwks'
    const TOKEN_ENDPOINT = '/token'
    const AUTH_ENDPOINT = '/authorize'

    const server = http.createServer(async (request, response) => {
      switch (request.url) {
        case JWK_ENDPOINT:
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
            issuer: IDP.issuer,
            jwks_uri: IDP.issuer + JWK_ENDPOINT,
            authorization_endpoint: IDP.issuer + AUTH_ENDPOINT,
            token_endpoint: IDP.issuer + TOKEN_ENDPOINT,
            response_types_supported: ['id_token', 'code'],
            grant_types_supported: ['authorization_code'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            scopes_supported: ['openid', 'email', 'profile']
          })

          response.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            'Content-Length': openIdConfiguration.length
          })

          response.end(openIdConfiguration)
        }

          break

        case TOKEN_ENDPOINT: {
          if (request.method !== 'POST') {
            response.writeHead(405, { 'Content-Type': 'text/plain' })
            response.end('Method not allowed')

            return
          }

          const buf = await buffer(request)
          const body = buf.toString('utf8')

          const params = new URLSearchParams(body)
          const grantType = params.get('grant_type')!
          const code = params.get('code')!
          const redirectUri = params.get('redirect_uri')!
          const clientId = params.get('client_id')!

          if (grantType !== 'authorization_code' || !code || !clientId) {
            response.writeHead(400, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ error: 'invalid_request' }))
          }

          const codeData = IDP.authCodes.get(code)

          if (!codeData ||
            codeData.expiresAt < Date.now() ||
            codeData.clientId !== clientId ||
            (redirectUri && codeData.redirectUri !== redirectUri)) {
            response.writeHead(400, { 'Content-Type': 'application/json' })
            response.end(JSON.stringify({ error: 'invalid_grant' }))

            return
          }

          const accessToken = crypto.randomBytes(32).toString('hex')
          const idToken = this.generateIdToken(codeData.sub, codeData.email, clientId)

          IDP.authCodes.delete(code)

          response
            .writeHead(200, { 'Content-Type': 'application/json' })
            .end(JSON.stringify({
              access_token: accessToken,
              token_type: 'Bearer',
              id_token: idToken,
              expires_in: 3600
            }))
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
    IDP.server = server
    IDP.issuer = `http://localhost:${address.port}`
  }

  @given('the IDP token for {word} is issued')
  public async issueToken (user: string): Promise<void> {
    assert.ok(IDP.privateKey, 'IdP private key is not available')

    const jwt = [
      {
        typ: 'JWT',
        alg: 'RS256'
      },
      {
        iss: IDP.issuer,
        sub: user,
        aud: 'test',
        email: user + '@test.local',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 1000 * 60 * 5) / 1000)
      }
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
      .join('.')

    const signature = crypto.createSign('RSA-SHA256').end(jwt).sign(IDP.privateKey, 'base64url')

    const idToken = `${jwt}.${signature}`

    this.captures.set(`${user}.id_token`, idToken)
  }

  @given('the IDP random token is issued')
  public async issueNewToken (): Promise<void> {
    assert.ok(IDP.privateKey, 'IdP private key is not available')

    const sub = Math.random().toString(36).substring(7)

    const jwt = [
      {
        typ: 'JWT',
        alg: 'RS256'
      },
      {
        iss: IDP.issuer,
        sub,
        aud: 'test',
        email: sub + '@test.local',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 1000 * 60 * 5) / 1000)
      }
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
      .join('.')

    const signature = crypto.createSign('RSA-SHA256').end(jwt).sign(IDP.privateKey, 'base64url')

    const idToken = `${jwt}.${signature}`

    this.captures.set('random.sub', sub)
    this.captures.set('random.email', sub + '@test.local')
    this.captures.set('random.id_token', idToken)
  }

  @given('the IDP {word} token for {word} is issued with following secret:')
  public async issueSymmetricToken (alg: string, user: string, secret: string): Promise<void> {
    const jwt = [
      {
        typ: 'JWT',
        alg
      },
      {
        iss: IDP.issuer,
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

  @given('ID token with jti is issued for {word}')
  public async issueTokenWithJti (user: string): Promise<void> {
    assert.ok(IDP.privateKey, 'IdP private key is not available')

    const jwt = [
      {
        typ: 'JWT',
        alg: 'RS256'
      },
      {
        iss: IDP.issuer,
        sub: user,
        aud: 'test',
        email: user + '@test.local',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 1000 * 60 * 5) / 1000),
        jti: crypto.randomUUID()
      }
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
      .join('.')

    const signature = crypto.createSign('RSA-SHA256').end(jwt).sign(IDP.privateKey, 'base64url')

    const idToken = `${jwt}.${signature}`

    this.captures.set(`${user}.id_token`, idToken)
  }

  @given('auth code for {word} is issued for {word}')
  public async issueAuthCode (user: string, redirectUri: string): Promise<void> {
    const code = crypto.randomBytes(16).toString('hex')
    const email = user + '@test.local'
    const clientId = 'nex'

    IDP.authCodes.set(code, {
      code,
      sub: user,
      email,
      clientId,
      redirectUri,
      expiresAt: Date.now() + 60 * 1000
    })

    this.captures.set(`${user}.auth_code`, code)
  }

  private generateIdToken (sub: string, email: string, clientId: string): string {
    assert.ok(IDP.privateKey, 'IdP private key is not available')
    assert.ok(IDP.issuer, 'IdP issuer is not available')

    const jwt = [
      {
        typ: 'JWT',
        alg: 'RS256'
      },
      {
        iss: IDP.issuer,
        sub,
        aud: clientId,
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor((Date.now() + 1000 * 60 * 5) / 1000)
      }
    ]
      .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
      .join('.')

    const signature = crypto.createSign('RSA-SHA256').end(jwt).sign(IDP.privateKey, 'base64url')

    return `${jwt}.${signature}`
  }
}

interface AuthCode {
  code: string
  sub: string
  email: string
  clientId: string
  redirectUri: string
  expiresAt: number
}
