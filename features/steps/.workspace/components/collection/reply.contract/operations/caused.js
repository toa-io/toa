export async function computation() {
  return new Error('KNOWN', { cause: { until: '2026-01-01' } })
}
