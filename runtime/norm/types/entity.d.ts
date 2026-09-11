import type { Entity } from './component.d.ts'

/** The schema a stored record must fit. */
export function schema(entity: Entity): object

/** The schema a changeset must fit: the same properties, none of them required. */
export function changeset(entity: Entity): object
