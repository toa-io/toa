import { origin } from '@/net'
import type { Configuration, Created, Node } from './Configuration'

const values = origin.resource('/configuration/values/', { credentials: 'include' })

/** What the resources answer with: the component names the item, the store keys by `id`. */
type Item = Omit<Configuration, 'id'>

export async function list(): Promise<Configuration[] | Error> {
  const items = await values.json<Item[]>()

  if (items instanceof Error) return items

  return items.map(identify)
}

export async function get(component: string): Promise<Configuration | Error> {
  const item = await values.json<Omit<Item, 'component'>>(component + '/')

  if (item instanceof Error) return item

  return identify({ ...item, component })
}

export async function create(component: string, configuration: Node): Promise<Created | Error> {
  return await values.json<Created>(component + '/', {
    method: 'POST',
    body: { configuration },
  })
}

/** A configuration is its component's, so the component is what identifies it. */
function identify(item: Item): Configuration {
  return { ...item, id: item.component }
}
