export { Factory } from './Factory.ts'

/** `context.chronicles` of a component that declares `chronicles`. */
export interface Chronicles {
  /**
   * Writes a fact that changes no state to the log, under `<component>.<name>`, of which what the
   * component declares of it is written. Resolves once the broker has it; nothing retries it.
   * Throws for a name the component does not declare, or a payload its declaration does not admit.
   */
  send(name: string, payload?: object, options?: Options): Promise<void>
}

/** What a fact is said to be of: the operation knows whose it is, the extension does not. */
export interface Options {
  /** the identity the fact is of */
  identity?: string
}
