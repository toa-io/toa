/** What the signals of this deployment may ask for. A deployment says nothing of what it
 *  does not take. */
export interface Configuration {
  halt?: Bounds
}

/** What a halt may ask for, in seconds. */
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
