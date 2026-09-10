import { swap } from '@toa.io/generic'
import type { SchemaError } from '@toa.io/schemas'

export const codes = {
  System: 0,

  Contract: 200,
  RequestSyntax: 201,
  RequestContract: 202,
  RequestConflict: 203,
  ResponseContract: 211,
  EntityContract: 212,
  EntityGuard: 213,
  QuerySyntax: 221,

  State: 300,
  StateNotFound: 302,
  StatePrecondition: 303,
  StateConcurrency: 304,
  StateInitialization: 305,
  Duplicate: 306,
  /** this call has been made, and what it changed is changed */
  DuplicateCall: 307,

  Communication: 400,
  Transmission: 401,
  Endpoint: 402,

  /** a chain that came back to where it had been, or went further than a chain goes */
  Loop: 500
}

export class Exception {
  public readonly code: number
  public readonly message: string
  public cause?: unknown;

  /** what a contract exception copies off the schema error it refused with */
  [key: string]: unknown

  public constructor(code: number, message: string, cause?: unknown) {
    this.code = code
    this.message = message

    if (cause !== undefined) this.cause = cause
  }
}

export class SystemException extends Exception {
  public readonly stack?: string

  public constructor(error: Error | string) {
    super(codes.System, typeof error === 'string' ? error : error.message)

    if (typeof error !== 'string' && error.stack !== undefined) this.stack = error.stack
  }
}

/**
 * A call refused for where it has been rather than for what it says. Named, and so permanent:
 * the chain is deterministic, and another attempt reproduces it hop for hop.
 */
export class LoopException extends Exception {
  /** the whole chain, so what is set aside can be read without guessing */
  public readonly trail: string[]

  public constructor(message: string, trail: string[]) {
    super(codes.Loop, message)

    this.trail = trail
  }
}

export class ContractException extends Exception {
  public constructor(
    code: number | undefined,
    error: SchemaError | string | null,
    cause?: unknown
  ) {
    super(
      code ?? codes.Contract,
      typeof error === 'string' ? error : (error?.message ?? ''),
      cause
    )

    if (typeof error === 'object' && error !== null)
      for (const k of [
        'keyword',
        'instancePath',
        'schemaPath',
        'params',
        'propertyName'
      ] as const)
        if (k in error) this[k] = error[k]
  }
}

export class RequestContractException extends ContractException {
  public constructor(error: SchemaError | string, cause?: unknown) {
    super(codes.RequestContract, error, cause)
  }
}

export class ResponseContractException extends ContractException {
  public constructor(error: SchemaError | string, cause?: unknown) {
    super(codes.ResponseContract, error, cause)
  }
}

export class EntityContractException extends ContractException {
  public constructor(error: SchemaError | string, cause?: unknown) {
    super(codes.EntityContract, error, cause)
  }
}

export class EntityGuardException extends ContractException {
  public constructor(name: string, cause?: unknown) {
    super(codes.EntityGuard, name, cause)
  }
}

// #region exports

// a module's exports are static, so the ones that follow a code are named rather
// than generated onto the namespace
type Derived = new (message?: string, cause?: unknown) => Exception

function derive(name: keyof typeof codes): Derived {
  const classname = name + 'Exception'

  const derived = class extends Exception {
    public constructor(message?: string, cause?: unknown) {
      super(
        codes[name],
        message === undefined ? classname : `${classname}: ${message}`,
        cause
      )
    }
  }

  // the name is the class's own, and a class expression has none worth reporting
  Object.defineProperty(derived, 'name', { value: classname })

  return derived
}

export const RequestSyntaxException = derive('RequestSyntax')
export const RequestConflictException = derive('RequestConflict')
export const QuerySyntaxException = derive('QuerySyntax')
export const StateException = derive('State')
export const StateNotFoundException = derive('StateNotFound')
export const StatePreconditionException = derive('StatePrecondition')
export const StateConcurrencyException = derive('StateConcurrency')
export const StateInitializationException = derive('StateInitialization')
export const DuplicateException = derive('Duplicate')
export const DuplicateCallException = derive('DuplicateCall')
export const CommunicationException = derive('Communication')
export const TransmissionException = derive('Transmission')
export const EndpointException = derive('Endpoint')

export const names = swap(codes)
// #endregion

/**
 * Whether a failure means the same thing on a later attempt.
 *
 * Every code answers, and the answer is here rather than inferred: `Record<keyof typeof codes>`
 * refuses to compile until a code added later says which it is. What core names, core raised on
 * purpose — a contract does not start fitting, a version that has passed does not come back.
 * `System` is the exception that proves it: it is a code like any other, and what it wraps is
 * whatever reached core from below, which is the kind that passes.
 */
const OUTCOME: Record<keyof typeof codes, 'permanent' | 'transient'> = {
  // whatever the algorithm or a connector threw: core neither chose it nor can read it
  System: 'transient',

  Contract: 'permanent',
  RequestSyntax: 'permanent',
  RequestContract: 'permanent',
  RequestConflict: 'permanent',
  ResponseContract: 'permanent',
  EntityContract: 'permanent',
  EntityGuard: 'permanent',
  QuerySyntax: 'permanent',

  State: 'permanent',
  // an event about an entity can outrun the one that creates it; nothing promises order
  StateNotFound: 'transient',
  // an entity's version only grows, so one that has passed does not start matching
  StatePrecondition: 'permanent',
  // the compare-and-swap lost, which is the case a later attempt exists for
  StateConcurrency: 'transient',
  StateInitialization: 'permanent',
  Duplicate: 'permanent',
  // a call that has been made stays made: another attempt is refused by the same record
  DuplicateCall: 'permanent',

  Communication: 'transient',
  // nothing is listening on that queue yet — a deployment in progress, most of the time
  Transmission: 'transient',
  // its sibling, and the other way round: nothing carried the call is a moment,
  // there is nothing to carry it to is a fact
  Endpoint: 'permanent',

  // the chain is deterministic, so another attempt walks it again: a retry is another cycle
  Loop: 'permanent'
}

const PERMANENT = new Set<number>(
  Object.entries(OUTCOME)
    .filter(([, outcome]) => outcome === 'permanent')
    .map(([name]) => codes[name as keyof typeof codes])
)

/**
 * Takes `unknown` because a caller has caught something rather than been handed an `Exception`.
 * Anything core did not raise — an error from a driver, a rejection with no code at all — is not
 * on the list, and is therefore worth trying again.
 */
export function permanent(exception: unknown): boolean {
  const code = (exception as Exception | undefined)?.code

  return code !== undefined && PERMANENT.has(code)
}
