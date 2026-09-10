/**
 * The extensions every component has, and every process loads.
 *
 * Per component, because what they contribute — the logs and the span on a context, the
 * outbound HTTP client, the description a component announces of itself — is what every
 * component is written expecting. Per process, because two of them contribute to the process
 * rather than to anything in it: the readiness probe answers for the process, and the halt
 * listener stops it. A process that runs no component of its own has both regardless.
 */
export const PREDEFINED: Record<string, null> = {
  '@toa.io/extensions.telemetry': null,
  '@toa.io/extensions.fetch': null,
  '@toa.io/extensions.introspection': null
}
