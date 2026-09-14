/** What a halt of this deployment may ask for, in seconds. */
export interface Bounds {
  duration: Range
  quiescence: Range
}

/** `[min, max]`. */
export type Range = [number, number]

/** What a halt asks of the deployment. */
export interface Signal {
  type: 'halt'
  seconds: number
  quiescence: number
}
