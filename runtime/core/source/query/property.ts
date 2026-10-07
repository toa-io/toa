/** What a component declares about the properties a query may name. */
export type Properties = Record<string, Property>

export interface Property {
  type?: string
  properties?: Properties
  items?: Property
}

/**
 * What an entity declares for the property a query names, by its name or by the path to it:
 * `size.volume` is `volume` of the object `size` holds. `undefined` where it declares none.
 *
 * An array is read as what it holds, at the end of a path and on the way: a storage compares
 * a value with each element of one, so `leaves.grams` is `grams` of the objects in `leaves`,
 * and `ranks` takes the value one of its elements may be.
 */
export function property(properties: Properties, path: string): Property | undefined {
  // a name is a client's to write, and `constructor` is no property of any entity
  if (Object.hasOwn(properties, path)) return held(properties[path])

  if (!path.includes('.')) return undefined

  let declared: Properties | undefined = properties
  let found: Property | undefined

  for (const name of path.split('.')) {
    if (declared === undefined || !Object.hasOwn(declared, name)) return undefined

    found = held(declared[name])
    declared = found?.type === 'object' ? found.properties : undefined
  }

  return found
}

function held(property: Property | undefined): Property | undefined {
  while (property?.type === 'array' && property.items !== undefined)
    property = property.items

  return property
}
