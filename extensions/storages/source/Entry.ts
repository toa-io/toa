export interface Entry {
  id: string
  size: number
  type: string
  created: number
  variants: Variant[]
  meta: Record<string, unknown>
}

interface Variant {
  name: string
  size: number
  type: string
}
