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

  Communication: 400,
  Transmission: 401,
  Endpoint: 402
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
export const CommunicationException = derive('Communication')
export const TransmissionException = derive('Transmission')
export const EndpointException = derive('Endpoint')

export const names = swap(codes)
// #endregion

/**
 * Whether a failure means the same thing on a later attempt.
 *
 * The enumeration is the answer. What core names, core raised on purpose, and it raises it
 * again for the same request: a contract does not start fitting, a version that has passed
 * does not come back. What core did not name reached it from below and arrives wrapped in a
 * `SystemException` — a storage that was unreachable, a third party that timed out — and that
 * is the kind that passes.
 *
 * So the default is that a failure passes, and being named is what makes one permanent. The
 * exceptions are `TRANSIENT`, kept few enough to defend one at a time.
 *
 * Takes `unknown` because a caller has caught something rather than been handed an `Exception`.
 */
export function permanent(exception: unknown): boolean {
  const code = (exception as Exception | undefined)?.code

  return code !== undefined && names[code] !== undefined && !TRANSIENT.has(code)
}

/** Named by core, and still worth trying again. */
const TRANSIENT = new Set<number>([
  // whatever the algorithm or a connector threw: core neither chose it nor can read it
  codes.System,
  // an event about an entity can outrun the one that creates it; nothing promises order
  codes.StateNotFound,
  // the compare-and-swap lost, which is the case a later attempt exists for
  codes.StateConcurrency,
  codes.Communication,
  // nothing is listening on that queue yet — a deployment in progress, most of the time
  codes.Transmission
  // `Endpoint` is its sibling and is not here: nothing carried the call is a moment,
  // there is nothing to carry it to is a fact
])
