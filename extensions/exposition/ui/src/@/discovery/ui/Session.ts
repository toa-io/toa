import type { Method } from '@/discovery'

export interface Props {
  route: string
  verb: string
  of: Method
  /** What closing it does; the dialog is the caller's, not this one's. */
  onclose: () => void
}
