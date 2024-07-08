export interface Entry {
  id: string
  size: number
  type: string
  created: number
  origin?: string
  variants: Variant[]
  meta: Record<string, unknown>
}

interface Variant {
  name: string
  size: number
  type: string
}
