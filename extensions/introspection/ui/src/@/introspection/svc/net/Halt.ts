/** What a halt of this deployment may ask for, in seconds. */
export interface Bounds {
  duration: Range
  quiescence: Range
}

/** `[min, max]`. */
export type Range = [number, number]
