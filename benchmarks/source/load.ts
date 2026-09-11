export interface LoadOptions {
  url: string
  method: string
  headers: Record<string, string>
  /** `host:port:address:port`: the URL names the authority, and the connection goes here */
  connect?: string
  /** a file the body of every request is read from */
  body?: string
  /** seconds; at a fixed rate, the requests sent are as many as the rate fills it with */
  duration: number
  connections: number
  /** requests per second; without one, as fast as the server answers */
  rate?: number
  http2: boolean
}

/** Requests answered with the expected status, their rate, and latency in milliseconds. */
export interface LoadResult {
  requests: number
  rate: number
  p50: number
  p99: number
}

export function args(options: LoadOptions): string[] {
  const { url, method, headers, connect, body, duration, connections, rate, http2 } = options

  const result = ['--no-tui', '--output-format', 'json']

  // At a fixed rate the window is a number of requests, all of which are waited for: oha 1.16
  // over HTTP/2 aborts what is in flight at a deadline, `-w` notwithstanding. At saturation the
  // window is a duration, and `-w` waits.
  if (rate === undefined) result.push('-z', `${duration}s`, '-w')
  else result.push('-n', String(Math.max(1, Math.round(rate * duration))))

  result.push('-c', String(connections), '-m', method)

  for (const [name, value] of Object.entries(headers)) result.push('-H', `${name}: ${value}`)

  // over HTTP/2 the authority is the URL's, so the URL names it and the address is given here
  if (connect !== undefined) result.push('--connect-to', connect)

  if (body !== undefined) result.push('-D', body)

  // a fixed rate measures latency as a client would see it, queueing included
  if (rate !== undefined) result.push('-q', String(rate), '--latency-correction')

  if (http2) result.push('--http2')

  result.push(url)

  return result
}

/** What `oha --output-format json` wrote, refused unless every request got the expected status. */
export function read(output: unknown, expected: number): LoadResult {
  if (!isOutput(output)) throw new Error('Not the JSON oha writes')

  const unexpected = [
    ...Object.entries(output.statusCodeDistribution)
      .filter(([status]) => Number(status) !== expected)
      .map(([status, count]) => `${status} × ${count}`),
    ...Object.entries(output.errorDistribution).map(([error, count]) => `${error} × ${count}`)
  ]

  if (unexpected.length > 0) throw new Error(`Unexpected answers: ${unexpected.join(', ')}`)

  const requests = output.statusCodeDistribution[String(expected)] ?? 0

  if (requests === 0) throw new Error('No requests were answered')

  return {
    requests,
    rate: output.summary.requestsPerSec,
    p50: milliseconds(output.latencyPercentiles.p50),
    p99: milliseconds(output.latencyPercentiles.p99)
  }
}

interface Output {
  summary: { requestsPerSec: number }
  latencyPercentiles: { p50: number; p99: number }
  statusCodeDistribution: Record<string, number>
  errorDistribution: Record<string, number>
}

function isOutput(value: unknown): value is Output {
  if (typeof value !== 'object' || value === null) return false

  const { summary, latencyPercentiles, statusCodeDistribution, errorDistribution } =
    value as Record<string, unknown>

  return [summary, latencyPercentiles, statusCodeDistribution, errorDistribution].every(
    (part) => typeof part === 'object' && part !== null
  )
}

/** oha states seconds; a microsecond is as fine as a report reads */
function milliseconds(seconds: number): number {
  return Math.round(seconds * 1e6) / 1e3
}
