/** What a call answered: the status it came back with, and what came back with it. */
export interface Answer {
  status: number

  /**
   * The body as it arrived — JSON where the reply was JSON, the text where it was not,
   * and what an error carries where it failed.
   */
  body: unknown

  /** Whether the gateway answered it, rather than refused or failed it. */
  ok: boolean
}
