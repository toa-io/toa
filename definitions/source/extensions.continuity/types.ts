/**
 * What one component declares under `continuity:`: the effects it continues, each with how long,
 * in seconds, a run of it that has not finished can still be picked up.
 */
export type Declaration = Record<string, number>
