/** What a commit publishes: the images of one state change. */
export interface Event<State = object, Trailers = object> {
  /** the pre-image; null when the entity did not exist before */
  origin: State | null
  state: State
  /** out-of-band values an algorithm wrote into `state._trailers`; must be serializable */
  trailers?: Trailers
  input?: object
}
