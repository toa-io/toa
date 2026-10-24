import * as schemas from './schemas.ts'
import { check } from './contract.ts'
import type { Declaration, Declared } from './types.ts'
import type { Manifest } from '@toa.io/norm'

/**
 * The `chronicles:` block of a component manifest: the events whose renderings are rows of the
 * log, the one whose payload is the entity as it stands, and the facts the component sends, each
 * with the contract of what is written of it. Norm hands over the whole manifest, prototype events
 * included, so a label is checked here rather than left to fail at boot.
 *
 * `chronicles: ~` is a component that logs nothing; it has to produce a value or norm rejects the
 * extension.
 */
export function manifest(
  declared: Declared | undefined,
  component: Manifest
): Declaration {
  const declaration = normalize(declared)

  schemas.declaration.validate<Declaration>(declaration, 'Invalid chronicles declaration')

  const name = id(component)
  const events = Object.keys(declaration.events)

  if (declaration.state !== undefined) events.push(declaration.state.event)

  for (const event of events)
    if (component.events?.[event] === undefined)
      throw new Error(
        `Chronicles of '${name}' name '${event}', which is not an event of the component.`
      )

  for (const [event, contract] of Object.entries(declaration.events))
    check(contract, `${name}.${event}`)

  if (declaration.state !== undefined)
    check(declaration.state, `${name}.${declaration.state.event}`)

  for (const [fact, contract] of Object.entries(declaration.facts))
    check(contract, `${name}.${fact}`)

  // the default may name nothing of the entity, and reads as none where it does not; a property
  // the component names is one it means to have
  const named = declared?.identity !== undefined
  const properties = (component.entity as { properties?: object } | undefined)?.properties

  if (
    named &&
    declaration.identity !== null &&
    properties !== undefined &&
    !(declaration.identity in properties)
  )
    throw new Error(
      `Chronicles of '${name}' name the identity '${declaration.identity}', ` +
        'which is not a property of the entity.'
    )

  return declaration
}

/** `identity` unless the component names another property, or none with `identity: ~`. */
function normalize(declared: Declared | undefined): Declaration {
  if (declared === null || declared === undefined)
    return { events: {}, facts: {}, identity: IDENTITY }

  return {
    ...declared,
    events: declared.events ?? {},
    facts: declared.facts ?? {},
    identity: declared.identity === undefined ? IDENTITY : declared.identity
  }
}

const IDENTITY = 'identity'

function id(component: Manifest): string {
  return component.namespace === undefined || component.namespace === 'default'
    ? component.name
    : `${component.namespace}.${component.name}`
}
