# Decentralized Request Throttling

> **Superseded.** The design below was never implemented. `io:throttle` now counts through
> [comcount](https://github.com/temich/comcount), by way of the `stash` extension's `count`, which
> solves the same problem the same way — per-process buffers, periodically reconciled through Redis,
> never failing the request path — with the interval number derived from Redis' own clock instead of
> each node's. This note is kept for the problem statement and the forces, which have not changed.

## Problem

To prevent an unnecessary load, API requests should be throttled when made maliciously or due to an
error.

## Context

1. The [API Gateway](https://microservices.io/patterns/apigateway.html) of a distributed system runs
   in multiple instances, each with an in-memory state that does not allow tracking the current
   quota usage.
2. Precise quota enforcement (per request, per second) is not critical; the goal is to prevent
   significant overuse.
3. Quota configuration is static.

## Forces

1. No per request IO is allowed (centralized solutions do not fit).
2. In a distributed system, there is no concept of a *global current time*.
3. Failure to retrieve the quota state should not result in Gateway failure.

## Solution

Implement in-memory quotas in each process, periodically synchronizing them asynchronously using
Redis.

Consider a basic throttling rule:

1. No more than `MAX_REQUESTS` within `INTERVAL` time for any API route (`KEY`).
2. If the limit is exceeded, block requests to `KEY` for `COOLDOWN` seconds.

### Concept

1. Divide `INTERVAL` into `N` spans (`N >= 2`).
2. At the end of each span,
   atomically increment the value in Redis ([INCRBY](https://redis.io/docs/latest/commands/incrby/))
   by the number of requests received for each `KEY`, using a key composed of the `KEY` and the
   current ordinal number of `INTERVAL`
   in [Unix epoch](https://en.wikipedia.org/wiki/Unix_time).
3. If the returned value exceeds `MAX_REQUESTS`, block access to `KEY`, remove after `COOLDOWN`.
4. If the write operation fails and `REQUESTS > MAX_REQUESTS / N` (i.e., the quota is exceeded
   locally), block access to `KEY`, remove after `COOLDOWN`.

Each API Gateway instance will generate the `KEY` based on its own local time,
which, in general, will lead to simultaneous writes (from Redis’s local time perspective) to
different `KEY`s. However, the total contribution of each node to each `KEY` will correspond to the
actual request rate experienced by that node.

<img src="desync.jpg" alt="Desynchronization" />

Dividing the `INTERVAL` into spans smooths the desynchronization effect.

### Extension

Introduce `nodes`, the approximate number of active API Gateway instances, to improve the algorithm.

1. Initially, `nodes` equals to `1`.
2. During each `INTERVAL`, sum the total request count for each `KEY`, keep current and previous
   values.
3. At the end of each interval:

- Read the value from the `KEY` for the previous interval. At this point, it is assumed that all
  nodes have switched to the next interval.
- Update the `nodes` value by dividing response form Redis by the number of `REQUESTS` counted for
  the previous interval.
- Set the previous value to the current value.
- Set the current value to `0`

4. Update point 4 of the [Concept](#concept): `REQUESTS * nodes > MAX_REQUESTS / N`.
   This will increase the precision of the local quota enforcement.
5. Add a new step: if `REQUESTS * nodes > MAX_REQUESTS`, block access to `KEY`, remove after
   `COOLDOWN`.

When nodes are added or removed, the algorithm will adapt in the upcoming intervals.

### Caveats

1. In the worst case scenario (really, really unlikely), the quota is exceeded by `MAX_REQUESTS / N`
   in a span on each node.
2. Time desynchronization between nodes should be insignificant for the selected `INTERVAL` (i.e.,
   `INTERVAL` >> desync). See Extension point 3.
