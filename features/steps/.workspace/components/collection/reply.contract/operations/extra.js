export async function computation() {
  return Object.assign(new Error('KNOWN'), { until: '2026-01-01' })
}
