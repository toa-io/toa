# Distributed Peer Discovery

## Problem

Modulo partitioning algorithm `taks.id % replicas == index` requires
to know the number of task processing instances running in the cluster,
and the own index of the current instance.

## Forces

1. Static configuration is not an option (due to dynamic scaling / failover).
2. In a distributed system, there is no concept of a *global current time*.

## Solution

An algorithm that emits `(index, replicas)` once per `interval` seconds, using common Redis
key and atomic increment.

Define the following parameters:

- `name`: a name of the task processing (e.g. `mail-sender`)
- `interval`: indexing interval that is deliberately greater than the expected clock skew among
  instances

At the start of each `interval` in [Unix epoch](https://en.wikipedia.org/wiki/Unix_time):

1. Calculate an ordinal number of the current interval: `number = ceil(now() / interval)`
2. Compose a `key` as `{name}:{number}`
3. Atomically increment a `key` in Redis ([INCR](https://redis.io/docs/latest/commands/incr/))
4. If `index` is defined (see 5)

- get the value of previous key `{name}:{number-1}` as `replicas`
- if the `replicas` is defined, emit `(index, replicas)` **algorithm result**

5. Store the response (3) in `index`.

## Safe index transition

If the `index` or `replicas` changes, the algorithm consumer must stop consuming new tasks
and execute _safe index transition_, to prevent task duplication or loss.

The transition can be implemented in a manner similar to the described algorithm, using a dedicated
`{name}:transition` key.
However, this process is considered outside the scope of this document.

## Extension

If the system clocks are too precisely synchronized (skew is less than a round-trip time to Redis),
this may result in continuous [index transitions](#safe-index-transition).

To mitigate this, the algorithm can be extended with a random delay:

1. Before starting the algorithm, define a random constant clock skew, significantly smaller than
   `interval`: `skew = random() * (interval / 2)`
2. Start the algorithm at each `interval + skew`.

## Caveats

- The first result will become known between `interval` and `interval × 2` seconds.
