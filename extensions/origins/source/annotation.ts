import type * as pointer from '@toa.io/pointer'

export function split (annotation: Annotation): {
  uris: pointer.Declaration
  properties: Properties
} {
  const uris: pointer.Declaration = {}
  const properties: Properties = {}

  for (const [key, value] of Object.entries(annotation))
    if (key[0] === '.') properties[key] = value as PropertySet
    else uris[key] = value as string | string[]

  return { uris, properties }
}

type PropertySet = Record<string, boolean>
type Properties = Record<string, PropertySet>
export type Annotation = Record<string, string | string[] | PropertySet>
