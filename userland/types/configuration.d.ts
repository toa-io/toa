/** A configuration value given as a secret: a string only to whoever asks for it. */
export interface Secret {
  unwrap: () => string
}
