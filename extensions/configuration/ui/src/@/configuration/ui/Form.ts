import { load } from 'js-yaml'
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import type { ClassValue } from 'svelte/elements'
import type { Node } from '@/configuration'

export interface Value {
  /** The configuration as the reader wrote it. */
  text: string
}

export interface Props {
  value: Value
  /** What the value is checked against. Without one nothing here can be checked. */
  schema?: object
  onsubmit?: (value: Node) => Promise<void | Error>
  oncancel?: () => void
  class?: ClassValue
}

/** What the text says, or what is wrong with it. */
export type Reading = { value: Node } | { errors: string[] }

/**
 * `useDefaults` is off: the service fills the schema's defaults when it stores the
 * value, and filling them here would put words in the reader's mouth.
 *
 * `$data` is off — it is ajv's default, said out loud because the option carries a
 * ReDoS of its own (GHSA-2g4f-4pwh-qvx6) and nothing here needs it.
 */
const ajv = new Ajv({ allErrors: true, strict: false, $data: false })

const validators = new WeakMap<object, ValidateFunction>()

/**
 * The configuration the text holds, or every reason it is not one. Nothing is sent that
 * has not passed this, so the service never refuses what the page could have caught.
 */
export function read(text: string, schema: object | undefined, malformed: string): Reading {
  let parsed: unknown

  try {
    parsed = load(text)
  } catch {
    return { errors: [malformed] }
  }

  // an empty document is an empty configuration, which is a thing a schema may allow
  const value = parsed ?? {}

  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return { errors: [malformed] }

  if (schema === undefined) return { value: value as Node }

  const validate = compile(schema)

  if (validate(value)) return { value: value as Node }

  return { errors: (validate.errors ?? []).map(describe) }
}

function compile(schema: object): ValidateFunction {
  let validate = validators.get(schema)

  if (validate === undefined) {
    validate = ajv.compile(schema)
    validators.set(schema, validate)
  }

  return validate
}

/** Where the fault is and what it is, as one line: `foo/0: must be integer`. */
function describe(error: ErrorObject): string {
  const at = error.instancePath.replace(/^\//, '')
  const said = error.message ?? 'is invalid'

  return at === '' ? said : `${at}: ${said}`
}
