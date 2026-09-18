/**
 * Where each component of the context answers a streamed call. A key states an address for the
 * component it names and for the components under it; `.` states one for every component of the
 * context, which a deployment normally leaves unsaid.
 */
export type Annotation = Record<string, string>

export function normalize(declaration: Declaration): Annotation {
  if (typeof declaration === 'string') return { '.': declaration }
  else return declaration
}

export type Declaration = string | Annotation
