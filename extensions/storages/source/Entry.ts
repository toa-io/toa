export interface Entry {
  id: string
  type: string
  created: number
  hidden: boolean
  variants: Variant[]
  meta: Record<string, unknown>
}

interface Variant {
  name: string
  type: string
}
