# Fetch extension

## Goal

Completely remove `@toa.io/extensions.origins` and replace its HTTP capability with a new built-in `@toa.io/extensions.fetch` extension.

The new extension provides `context.fetch()`, compatible with the standard WHATWG `fetch`, with telemetry and optional retries built in.

Removing `origins` also removes its AMQP and Pub/Sub aspects. They are outside the scope of `fetch` and must not be moved into the new extension.

HTTP caching is explicitly outside the scope of this solution. `context.fetch()` must not add a cache, persistent storage, temporary files, cache configuration, or cache-specific deployment resources.

## Public interface

```ts
interface FetchInit extends RequestInit {
  retry?: {
    attempts: number
    expected?: number[]
    delay?: number
    factor?: number
  }
}

type ContextFetch = (
  input: string | URL | Request,
  init?: FetchInit
) => Promise<Response>
```

```js
const response = await context.fetch('https://example.com/items', {
  method: 'POST',
  body: JSON.stringify(input),
  retry: {
    attempts: 3,
    expected: [200, 201]
  }
})
```

Except for `init.retry`, arguments, results, and exceptions must match the native Node.js `fetch`. Support for `Request`, `Response`, `AbortSignal`, redirects, and streaming must be preserved.

Non-standard `origins` features—named origins, URL substitutions, permissions, and origin-level retry options—will not be carried over.

## Built-in activation

Extensions are normally instantiated only when a declaration exists in a normalized component manifest. `fetch` has nothing for a component to declare, so it must follow the existing telemetry mechanism.

Add fetch to `PREDEFINED` in `runtime/norm/src/.component/extensions.js`:

```js
const PREDEFINED = {
  '@toa.io/extensions.telemetry': null,
  '@toa.io/extensions.fetch': null
}
```

This causes `runtime/boot/src/extensions/load.js` and `aspects.js` to resolve the package and create its aspect for every component. Every Node component therefore receives `context.fetch` without adding `fetch:` or `extensions:` to its manifest.

No user-facing manifest shortcut, schema, context annotation, deployment hook, environment variable, or configuration is required for fetch activation.

Add normalization and boot tests proving that:

- a component with no extension declarations receives the fetch extension;
- explicitly declared extensions do not replace or remove predefined fetch;
- the normalized fetch declaration is `null`;
- the fetch Factory is loaded and its aspect is present for every component;
- `context.fetch` is available without a manifest or context annotation.

## Retry

Retries are disabled by default. They are enabled only when `init.retry` is present.

Settings:

- `attempts` — required integer of at least `1`; maximum total number of attempts, including the first one;
- `expected` — expected response statuses; defaults to any status from `200` through `299`;
- `delay` — delay before the first retry in milliseconds; defaults to `100`;
- `factor` — exponential backoff multiplier; defaults to `2`.

For example, with `attempts: 4`, `delay: 100`, and `factor: 2`, delays before retries are `100`, `200`, and `400` milliseconds.

Behavior:

- network errors are retried while attempts remain;
- an unexpected HTTP status starts the next attempt;
- before another attempt, the unexpected response body is cancelled with
  `response.body.cancel()`; it is not buffered or exposed to the caller, and a cancellation error
  does not prevent the retry;
- after the final unexpected HTTP status, the last `Response` is returned;
- the body of the final returned `Response` remains untouched and readable by the caller;
- after the final network error, the exception is propagated to the caller;
- `Retry-After` replaces the calculated delay for that retry;
- `AbortSignal` stops the current request and any wait between attempts;
- the method is always taken from `Request`; there is no separate list of retryable methods;
- a streaming or otherwise non-replayable body cannot be retried: with `attempts > 1`, such a request must be rejected before the first send.

`retry: { attempts: 1 }` is equivalent to no retries.

The implementation may reuse `@toa.io/generic/retry`, with HTTP response handling and abort-aware waiting added around it.

## Telemetry

Every `context.fetch()` call creates one logical parent span covering retry orchestration and delays.
Each actual network attempt creates a nested client span.

Span name:

```text
POST https://google.com
```

It is constructed as:

```ts
`${request.method} ${new URL(request.url).origin}`
```

Span attributes:

- `http.request.method`;
- `server.address`;
- `server.port`, when explicitly present;
- `url.scheme`;
- final HTTP status;
- actual number of attempts.

Attempt span names and hierarchy:

```text
POST https://google.com
├── attempt 1
├── attempt 2
└── attempt 3
```

Each attempt span records `retry.attempt` and its own `http.response.status_code`. A network error
marks the corresponding attempt span as failed. If a later attempt succeeds, the parent span remains
successful; if the complete call throws, the parent span is also marked as failed.

The full URL, query parameters, authorization headers, and request or response bodies must not be recorded in telemetry.

A network error marks the span as failed. An HTTP response, including an unexpected status after retries are exhausted, remains a regular `Response`.

## Extension implementation

1. Create `extensions/fetch` with its package metadata, source, tests, README, and transpiled output. No declaration schema or deployment module is needed.
2. Implement a Factory that creates a fetch Aspect for every component from the predefined `null` declaration.
3. Add `@toa.io/extensions.fetch: null` to `PREDEFINED` in `runtime/norm/src/.component/extensions.js`, next to telemetry.
4. Add the extension to `runtime/runtime` dependencies so the predefined package can always be resolved at boot.
5. Expose `context.fetch` through `connectors/bridges.node` as a regular function rather than a dynamic underlay.
6. Add TypeScript definitions for `context.fetch` and `FetchInit`.
7. Implement retry orchestration around the native Node.js `fetch`.
8. Wrap the complete call in one logical span and every network attempt in a nested client span
   through `openspan`.

## Removing origins

Remove:

- the entire `extensions/origins` directory, including source, schemas, tests, README, and transpiled output;
- the `origins` shortcuts from `runtime/norm`;
- the `@toa.io/extensions.origins` package from `runtime/runtime/package.json`;
- the `context.http` shortcut and its tests from `connectors/bridges.node`;
- origins fixtures and integration dummies;
- `features/extensions/origins.feature` and `origins.pubsub.feature`;
- origins configuration from `userland/example`;
- deployment logic, secrets, and variables named `TOA_ORIGINS_*`, `toa-origins-*`, and pointer IDs named `origins-*`;
- references to origins from the root README and other documentation.

Check the hardcoded `toa-origins-pubsub` name in `libraries/pointer` separately.

There are currently no production consumers of `context.http` in the repository. Only obsolete dummies, the userland example, connector tests, and feature scenarios are removed. Independent unit fixtures and Gherkin scenarios for the new `context.fetch` replace them. The abandoned integration test suite is not extended.

Do not remove unrelated domain fields named `origin` used by CORS, WebAuthn, entities, or storage metadata.

## Testing

### Fetch contract

- URL with `RequestInit`;
- an existing `Request` and overrides through `init`;
- response status, status text, headers, body, redirected flag, and URL;
- streaming request and response bodies without retries;
- redirects and `AbortSignal`;
- compatibility of the returned value with the native `Response`;
- confirmation that no cache or storage layer changes native fetch behavior.

### Retry

- no retries without `init.retry`;
- `attempts: 1`;
- a successful response on the first and subsequent attempts;
- default `200` through `299` expected status range;
- overriding `expected`;
- network errors;
- returning the last unexpected `Response`;
- exponential backoff and `Retry-After`;
- aborting during a request and while waiting;
- rejection of a non-replayable body before the first attempt.

### Telemetry

- parent span name in `METHOD origin` format;
- one nested `kind: client` span per actual network attempt;
- required HTTP attributes on the parent and attempt spans;
- actual attempt count;
- final HTTP status;
- failed span on a network exception;
- absence of sensitive data and the full URL.

### Built-in activation

- normalized manifests contain both predefined telemetry and fetch extensions;
- fetch is available without a manifest declaration;
- explicit unrelated extensions do not disable fetch;
- each component receives its own fetch Aspect.

### Gherkin

- a component with no fetch declaration performs a real request through `context.fetch`;
- an unexpected response is retried and an expected response is returned;
- no retry occurs when `init.retry` is omitted;
- one logical parent span records the method, origin, final status, and actual attempt count;
- nested client spans represent every actual network attempt.

### General verification

After removal, search for:

- `extensions.origins`;
- `extensions/origins`;
- `context.http`;
- the `origins` manifest key;
- `TOA_ORIGINS`;
- `toa-origins`.

Then regenerate `package-lock.json` and run transpilation, lint, unit tests, and Gherkin feature tests.

## Definition of done

The repository no longer contains the `origins` infrastructure extension or the `context.http` API. Every Node component receives the built-in WHATWG-compatible `context.fetch` without a manifest declaration. Calls create logical spans named `METHOD origin` with nested client spans for network attempts, and retries are available only through an explicitly provided `init.retry`. The extension contains no HTTP caching or storage mechanism.
