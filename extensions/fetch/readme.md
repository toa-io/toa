# Fetch

The Fetch extension provides every Node component with a WHATWG-compatible `context.fetch()`.
It is built in and requires no manifest declaration.

```js
const response = await context.fetch('https://example.com/items')
```

## Retry

Retries are disabled unless `retry` is provided in the second argument.

```js
const response = await context.fetch('https://example.com/items', {
  retry: {
    attempts: 3,
    expected: [200],
    delay: 100,
    factor: 2
  }
})
```

- `attempts` is required and includes the initial request.
- `expected` defaults to all statuses from `200` through `299`.
- `delay` defaults to `100` milliseconds.
- `factor` defaults to `2`.

`Retry-After` takes precedence over the calculated delay. Aborting the request also aborts a retry
delay. After the final unexpected HTTP response, that `Response` is returned. After the final
network failure, the error is thrown.

When a response status is not expected and another attempt remains, the extension calls
`response.body.cancel()` before waiting and retrying. The unexpected body is not exposed to the
caller and is not buffered or drained. Cancellation is best-effort: a cancellation error does not
prevent the next attempt. If no attempts remain, the final unexpected `Response` is returned with
its body untouched, so the caller can consume it normally.

An explicit `ReadableStream` body and a `Request` input that already contains a body cannot be
retried because their contents cannot be recreated safely. They remain supported when retries are
disabled or `attempts` is `1`.

## Telemetry

Each call creates one logical parent span whose name has the form `POST https://example.com`.
Every actual network attempt creates a nested client span:

```text
POST https://example.com
├── attempt 1
├── attempt 2
└── attempt 3
```

The parent span records the final status and total number of attempts. Each attempt span records its
one-based attempt number and response status. A network failure marks that attempt span as failed;
the parent is marked as failed only when the complete fetch call fails. The full URL, query string,
headers, and bodies are not recorded.

The extension does not cache responses.
