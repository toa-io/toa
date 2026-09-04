/**
 * @deprecated import `Secret` from `@toa.io/extensions.configuration`, which is what makes one.
 *
 * Stated here rather than re-exported: this package is compiled by whoever imports it, and
 * reaching into the extension's built declarations would make them wait for that build.
 */
export interface Secret {
  unwrap: () => string
}
