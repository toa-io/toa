export { Factory } from './Factory.ts'

/** `context.chronicles` of a component that declares `chronicles`. */
export interface Chronicles {
  /**
   * Writes a fact that changes no state to the log, under `<component>.<name>`. Resolves once the
   * broker has it; nothing retries it.
   */
  send(name: string, payload?: object): Promise<void>
}
