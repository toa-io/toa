import type { Entity } from './request.ts'
import type { JSONSchema } from './schemas.ts'

/**
 * What the root prototype gives every entity, as `runtime/prototype/manifest.toa.yaml` declares
 * it. Held here because a contract is read where that package is not — a gateway reads one of a
 * component it does not have — and kept the same as the prototype by a test in `@toa.io/norm`,
 * which has both.
 *
 * `id` is apart from the rest: a component may declare its own, and the rest it may not.
 */
export const ID: JSONSchema = { type: 'string', pattern: '^[a-fA-F0-9]{32}$' }

export const SYSTEM: Record<string, JSONSchema> = {
  VERSION: { type: 'integer', minimum: 0 },
  CREATED: { type: 'integer', format: 'epoch-millis' },
  UPDATED: { type: 'integer', format: 'epoch-millis' },
  DELETED: { type: 'integer', format: 'epoch-millis', nullable: true },
  REGION: { type: 'integer', minimum: 0 }
}

/** What the prototype requires, which is every property it gives. */
const REQUIRED = ['id', ...Object.keys(SYSTEM)]

/**
 * Whether one declaration is the other. Compared as written rather than by walking it: a
 * component cannot have written a system property itself — a manifest that redeclares one is
 * refused — so what is there came from the prototype and is identical to it. A comparison that
 * says no costs the property being written out, and nothing else.
 */
export function same(one: unknown, other: unknown): boolean {
  return JSON.stringify(one) === JSON.stringify(other)
}

/**
 * The entity without what the runtime gives it, saying that it did. An entity a component
 * declares itself — one whose prototype is `null` — may give four of them, or five, or the same
 * names with other schemas, so it is stated as it stands and says nothing.
 */
export function pack(entity: Entity): Entity {
  if (!given(entity)) return entity

  const properties: Record<string, JSONSchema> = {}

  for (const [name, property] of Object.entries(entity.properties))
    if (!(name in SYSTEM) && !(name === 'id' && same(property, ID)))
      properties[name] = property

  const required = (entity.required ?? []).filter((name) => !REQUIRED.includes(name))

  return {
    properties,
    ...(required.length === 0 ? {} : { required }),
    system: true
  }
}

/**
 * The entity as the component declared it, which is what anything reading one is given.
 *
 * What is put back is a copy of it. An entity's schemas were its own before a contract left any
 * of them out, and whoever holds one edits it — a route takes a property out of what it
 * describes — so two components sharing one object is not a thing to start doing here.
 */
export function unpack(entity: Entity): Entity {
  if (entity.system !== true) return entity

  const declared: Entity = {
    ...entity,
    properties: {
      ...entity.properties,
      ...(entity.properties.id === undefined ? { id: structuredClone(ID) } : {}),
      ...structuredClone(SYSTEM)
    },
    required: [...(entity.required ?? []), ...REQUIRED]
  }

  delete declared.system

  return declared
}

/** Whether what the prototype gives is what this entity carries, which is what may be left out. */
function given(entity: Entity): boolean {
  for (const [name, property] of Object.entries(SYSTEM))
    if (!same(entity.properties[name], property)) return false

  return REQUIRED.every((name) => entity.required?.includes(name) === true)
}
