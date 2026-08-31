# Toa Redis Partitions

Splits the outbox sweep across the replicas of one component, so that each replica writes into
lanes it owns and settles its own rows before it ever sweeps them.

The arithmetic is [n-and-i](https://github.com/temich/nandi): every replica registers in a Redis
counter once per interval and receives an exclusive `{ i, n }` pair once two consecutive intervals
have agreed on it. A replica owns the lanes where `lane % n === i`, and owns none while it holds no
pair — after a restart, during a rollout, or while Redis is unreachable.

## Configuration

This Redis is system infrastructure rather than a per-component resource: it holds nothing but
interval counters, one small key per component group. It is declared once for the whole deployment
and reaches the runtime as a single environment variable.

```yaml
# context.toa.yaml
outbox:
  redis: redis://redis.example.com    # a string, or a list for a cluster
```

`TOA_OUTBOX_REDIS`, space-separated for a list. `TOA_OUTBOX_PARTITION_INTERVAL` overrides the
registration interval, which is 10 seconds by default.

## Diagnostics

The loop reports through the runtime's own console, forked with the component it belongs to, so
every line carries `context.component`. A healthy group never rises above `info`: `warn` means a
lease was lost, `error` that something outside the coordination broke.

## Invariant

**When in doubt, own nothing.** A replica that cannot prove which lanes are its own reports none,
and the runtime suspends its sweep until it can. Reading without an assignment would not be a
degraded version of reading with one — it would be a different guarantee, where every replica
publishes every stranded row.

Suspension is the normal state during a rebalance: a replica joining or leaving the group costs
about an interval in which nobody holds a pair, and the sweep picks up again on its own once the
group settles. Nothing has to be restarted, and no row is lost — recovery is delayed by exactly
as long as the group takes to agree.

The runtime behaves the same way when this connector is absent: rows are written and published as
they are committed, and the sweep stays suspended.
