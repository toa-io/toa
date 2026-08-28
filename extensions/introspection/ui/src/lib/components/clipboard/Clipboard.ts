import type { Snippet } from 'svelte'
import type { ButtonProps } from '$ui/button'

export interface Props extends ButtonProps {
  text: Retriever
  label?: string
  /** Stands in for the copy icon where the button says what it copies rather than that it copies. */
  icon?: Snippet
  oncopy?: () => void
}

export type Retriever = (() => Promise<string>) | string
