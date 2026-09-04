import assert from 'node:assert'
import { match } from 'matchacho'
import { console } from 'openspan'
import { Minimatch } from 'minimatch'
import * as http from '../../HTTP/index.js'
import { Anonymous } from './Anonymous.js'
import { Id } from './Id.js'
import { Role } from './Role.js'
import { Rule } from './Rule.js'
import { Incept } from './Incept.js'
import { Assert } from './Assert.js'
import { Echo } from './Echo.js'
import { Scheme } from './Scheme.js'
import { Delegate } from './Delegate.js'
import { Federation } from './Federation.js'
import { Anyone } from './Anyone.js'
import { Input, type Declaration } from './Input.js'
import { split } from './split.js'
import { PRIMARY, UNRECOGNIZED, providers as providersOf } from './schemes.js'
import { ATOM_GROUP } from '../../const.js'
import { Quotas, Sync } from '../io/lib/throttle/index.js'
import { Keys } from '../io/lib/throttle/Keys.js'
import type { Output } from '../../io.js'
import type { Component } from '@toa.io/core'
import type { Remotes } from '../../Remotes.js'
import type { Parameter, DirectiveFamily } from '../../RTD/index.js'
import type { Host } from '../../Factory.js'
import type {
  AuthenticationResult,
  Ban,
  Directive,
  Discovery,
  Extension,
  Identity,
  Context,
  Remote,
  Components
} from './types.js'

export class Authorization implements DirectiveFamily<Directive, Extension> {
  public readonly depends: string[] = ['Vary']
  public readonly name: string = 'auth'
  public readonly mandatory: boolean = true

  private readonly components: Components = {}
  private readonly discovery = {} as unknown as Discovery
  private tokens: Component | null = null
  private bans: Component | null = null

  /** Failed authentications per address, reconciled with the other gateways. */
  private meter: Quotas | null = null
  private sync: Sync | null = null

  public mount (host: Host, options: http.Options): void {
    this.sync?.dispose()
    this.sync = null
    this.meter = null

    const bouncer = options.bouncer

    // keyed by address, which is the deployment's to name, so off until it is set
    if (bouncer === undefined)
      return

    this.meter = new Quotas({
      keys: Keys.create([{ method: 'ip', options: BOUNCER }]),
      requests: bouncer.attempts ?? ATTEMPTS,
      interval: (bouncer.interval ?? INTERVAL) * 1000,
      conditional: true, // charged on a rejection, not on a check
      name: METER
    })

    this.sync = new Sync(host.atom(ATOM_GROUP))
    this.sync.register(this.meter)
  }

  public dispose (): void {
    this.sync?.dispose()
  }

  public create (name: string, value: any, remotes: Remotes): Directive {
    assert.ok(name in constructors,
      `Directive 'auth:${name}' is not implemented`)

    const Class = constructors[name]

    for (const name of REMOTES)
      this.discovery[name] ??= remotes.discover('identity', name)

    return match(Class,
      Role, () => new Role(value as string | string[], this.discovery.roles),
      Rule, () => new Rule(value as Record<string, string>, this.create.bind(this)),
      Input, () => new Input(value as Declaration[], this.create.bind(this)),
      Incept, () => new Incept(value as string, this.discovery),
      Delegate, () => new Delegate(value as string, this.discovery.roles),
      () => new Class(value))
  }

  public arrange (directives: Directive[]): void {
    directives.sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1))
  }

  public async preflight (directives: Directive[],
    context: Context,
    parameters: Parameter[]): Promise<Output> {
    context.identity = await this.resolve(context)

    for (const directive of directives) {
      const allow = await directive.authorize(context.identity, context, parameters)

      if (allow)
        if (this.permitted(context))
          return directive.reply?.(context) ?? null
        else
          throw new http.Forbidden()
    }

    if (context.identity === null)
      throw new http.Unauthorized()
    else
      throw new http.Forbidden()
  }

  public async settle (directives: Directive[],
    context: Context,
    response: http.OutgoingMessage): Promise<void> {
    await Promise.all(directives.map(async (directive) =>
      directive.settle?.(context, response)))

    const identity = context.identity

    if (identity === null)
      return

    if (identity.provider === PRIMARY && !identity.refresh)
      return

    if (await this.banned(identity))
      throw new http.Unauthorized()

    // a token carries the roles it was issued with, and the refresh is where they are read again;
    // any other scheme has just read them, unless a Role directive already did
    if (identity.provider === PRIMARY)
      identity.roles = await Role.get(identity, this.discovery.roles)
    else
      identity.roles ??= await Role.get(identity, this.discovery.roles)
    this.tokens ??= await this.discovery.tokens

    const token = await this.tokens.invoke<string>('encrypt', {
      input: { authority: context.authority, identity }
    })

    const authorization = `Token ${token}`

    response.headers ??= new Headers()
    response.headers.set('authorization', authorization)
    response.headers.set('cache-control', 'no-store')
  }

  private async resolve (context: Context): Promise<Identity | null> {
    const { authority } = context
    const { authorization } = context.request.headers

    if (authorization === undefined)
      return null

    const retry = this.meter?.check(context, NONE) ?? 0

    if (retry > 0)
      throw new http.TooManyRequests(retry)

    const [scheme, credentials] = split(authorization)
    const candidates = providersOf(scheme)

    if (candidates === undefined)
      throw new http.Unauthorized(`Unknown authentication scheme '${scheme}'`)

    let provider: Remote | null = null
    let result: AuthenticationResult | null = null

    // the first provider that does not decline has claimed the credentials, and answers
    // for them: a rejection from one that never recognized them is not the rejection
    for (const candidate of candidates) {
      this.components[candidate] ??= await this.discovery[candidate]

      const answer = await this.components[candidate]!.invoke<AuthenticationResult>('authenticate', {
        input: {
          scheme,
          authority,
          credentials
        }
      })

      if (declined(answer))
        continue

      provider = candidate
      result = answer

      break
    }

    if (result === null || result instanceof Error) {
      const code = result === null ? UNRECOGNIZED : codeOf(result)

      if (code !== undefined) {
        console.info('Authentication failed', { code })

        context.rejection = code
      }

      this.meter?.use(context, null)

      return null
    }

    const identity = result.identity

    if (provider !== PRIMARY && (await this.banned(identity))) throw new http.Unauthorized()

    identity.scheme = scheme
    identity.provider = provider!
    identity.refresh = result.refresh

    return identity
  }

  private permitted (context: Context): boolean {
    const permissions = context.identity?.permissions

    if (permissions === undefined)
      return true

    // the route is matched on the normalized path, so the permission is too
    return permits(permissions, context.request.method, context.url.pathname)
  }

  private async banned (identity: Identity): Promise<boolean> {
    this.bans ??= await this.discovery.bans

    const ban = await this.bans.invoke<Ban>('observe', { query: { id: identity.id } })

    return ban.banned
  }
}

/** Whether a provider says the credentials are not of its kind, so the next is asked. */
function declined (result: AuthenticationResult): boolean {
  return result instanceof Error && codeOf(result) === UNRECOGNIZED
}

function codeOf (result: Error): string | undefined {
  const code: string | unknown = (result as unknown as { code: string }).code

  return typeof code === 'string' ? code : undefined
}

/** Whether the permissions admit the method on the path the request is routed by. */
export function permits (permissions: Record<string, string[]>, method: string, pathname: string): boolean {
  return Object.entries(permissions).some(([pattern, methods]) =>
    methods.some((allowed) => allowed === '*' || allowed === method) &&
    glob(pattern).match(pathname))
}

/**
 * `minimatch(str, pattern)` compiles the pattern on every call, and a permission is
 * matched on every request the identity makes. Patterns arrive with an identity, hence
 * the bound.
 */
function glob (pattern: string): Minimatch {
  let compiled = GLOBS.get(pattern)

  if (compiled === undefined) {
    if (GLOBS.size >= GLOBS_LIMIT)
      GLOBS.clear()

    compiled = new Minimatch(pattern)

    GLOBS.set(pattern, compiled)
  }

  return compiled
}

/** What an address may fail at once, and the seconds it takes to earn them back. */
const ATTEMPTS = 20
const INTERVAL = 60

/** Who is speaking when a request cannot be keyed. */
const BOUNCER = 'Authentication bouncer'

/** The meter's name in the atom: `atom:exposition:meter:credentials:<address>`. */
const METER = 'credentials'

const NONE: Parameter[] = []

const GLOBS = new Map<string, Minimatch>()
const GLOBS_LIMIT = 1024

const constructors: Record<string, new (value: any, argument?: any) => Directive> = {
  anonymous: Anonymous,
  anyone: Anyone,
  id: Id,
  role: Role,
  rule: Rule,
  incept: Incept,
  assert: Assert,
  scheme: Scheme,
  echo: Echo,
  delegate: Delegate,
  claims: Federation,
  input: Input
}

const REMOTES: Remote[] = ['basic', 'federation', 'tokens', 'roles', 'bans', 'otp']
