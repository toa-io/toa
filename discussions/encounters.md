# Encounters and declared chronicles

## Design concept

The log is read by agents, which write SQL against what they are told the log holds. Today they
are told the fields the latest payloads happen to have, and nothing of what a field means, what
type it is, or whether the log is still being written. What browsers send shares a table with
what components commit, under a prefix, though nothing about the two is alike: one is a contract
a deploy enforces, the other is whatever clients in the wild still send.

Two changes follow. A component declares every event, its state and every fact it logs, each
field typed and described; only what is declared is written, and every declared label is a
typed view an agent queries by column. What clients send is an _encounter_: a table of its own,
with the visitor and the session that tell one journey from another, documented in the
configuration of `chronicles.encounters` rather than enforced, because an old client cannot be
made to send a new shape.

### Guarantees

**What a component logs**

1. A label is written only where the component declares it, with a schema whose every property,
   at every depth, has a `type` and a `description`. A declaration that misses either, or uses
   what has no type of the store, is refused when the component is read.
2. What a row of a declared label holds is the declared properties of the payload and nothing
   else, at every depth: a property the declaration leaves out is not written. `id`, `VERSION`,
   `UPDATED` and the identity property are read before, and need not be declared.
3. A payload whose declared property is of another type is not written: an event or a state is
   parked on its first delivery, as a state that does not say which entity it is is today, and
   `send` throws. `send` of a name the component does not declare throws.
4. Every declared label, and every state, is a view of the log by the name of the label with its
   dots as underscores, whose columns are the declared properties in the store's types. A value
   that is not of its type reads as `NULL` there; the row keeps it.
5. A view of a declaration that is gone is gone once the scribe starts after it.

**What clients send**

6. An encounter is a row of `encounters` under the name the client gave it, with the `visitor` and
   `session` the batch names, `received` when the gateway received the batch, and `time` that
   less how long before sending it the client says it happened.
7. An encounter's payload is written as sent, within the limits of today; nothing is stripped or
   refused for its shape.
8. A row of the route of an identity has both the `visitor` and the `identity`: the visitors of
   an identity are a query.
9. What a client's clock says decides nothing: neither `time`, which is the gateway's clock at the
   distance the client measured, nor where a row is kept and when it expires, which is by
   `received`.
10. An encounter has the `origin` and the `agent` of the request, and the `browser`, `os` and
    `device` the agent names; a body cannot say any of them for the request.
11. The documentation of encounters is the configuration of `chronicles.encounters`, served to a
    holder of `system:chronicles:encounters`, and changed only as configuration is.

**Reading**

12. `describe` tells, of every label and state, the latest `time`, of every encounter the newest
    `received`, and of every
    field its type and description: the declared ones for labels and states, the observed types
    and the documented description for encounters.
13. A view has a `title` and a `description` where it was defined with them, and a view with
    `refresh` the time it was last refreshed.
14. The reader runs at most a few queries at once, and answers at most a bounded number of bytes.

**Not promised**

- That the visitor is a person: many visitors may be one identity, and one browser may clear its
  visitor.
- That a count of a recent period is final: a row the scribe takes late is written at its own
  time.
- That the encounters documented are the ones sent.

### What a component author does differently

```yaml
# manifest.toa.yaml
chronicles:
  identity: customer
  events:
    paid:
      description: An order's payment completed
      properties:
        total:
          type: integer
          description: The amount paid, in cents
        shipping:
          type: object
          description: Where the order goes
          properties:
            country:
              type: string
              description: ISO 3166 alpha-2
  state:
    event: snapshot
    description: An order as it stands
    properties:
      status:
        type: string
        enum: [new, paid, shipped]
        description: Where the order is in its life
  facts:
    searched:
      description: A customer searched the catalogue
      properties:
        query:
          type: string
          description: What was typed
```

```sql
SELECT shipping.country, sum(total) / 100 AS paid FROM store_orders_paid GROUP BY 1
```

A client sends `{ visitor, session, events }` to `/chronicles/encounters/`, and the context
documents what it sends:

```yaml
# context.toa.yaml
configuration:
  chronicles.encounters:
    page_viewed:
      description: A page was shown
      fields:
        path: The URL path, without the query
```

## The changes, by area

### 1. Definitions

- The declaration: `events` and `facts` are maps of a label to its contract, `state` is a
  contract with the `event` it is; the list form is gone. A contract is `description` and
  `properties`, JSON Schema of the types the store maps, every property described.
- The settings the scribe is given carry the contracts of every label, state and fact.
- The annotation's `ingest` is `encounters`.

### 2. `extensions/chronicles`

- `chronicles.ingestion` is `chronicles.encounters`: its rows go to `encounters`, the batch has
  `visitor` and `session`, and `GET /` answers its configuration.
- The recorder and the facts project a payload onto its contract and refuse what does not fit;
  the sender refuses a fact the component does not declare.
- The provider: the table `encounters`, `events` without `ip` and `country`, the typed views, the
  latest `time` in `describe`, the views' comments and refreshes, the reader's limits.

### 3. Documentation

The readme of the extension, and the published documentation.

## Decisions

- **Declared, not inferred.** The fields of the latest payloads tell an agent neither the unit
  nor the meaning, and two payloads of a label may disagree. Declaring every field with a
  description costs a component author a line each, once.
- **The declaration is never the entity's schema.** A state or an event that renders the entity
  is declared like any other: what is logged is a decision about the log, and a property added to
  the entity is not thereby logged.
- **Projection rather than refusal of undeclared properties.** The declaration is how heavy or
  personal fields stay out of the log, without a `payload` written for the purpose.
- **Typed views over JSON storage, rather than columns.** A column per field makes a change of a
  contract a migration of a table that holds its history in the old type; a view is replaced, and
  the history stays readable from the JSON it was written as.
- **Encounters are documented, not enforced.** A client is deployed once and runs for months. A
  refused batch is lost activity, and a stripped field is one a newer client meant to send. A
  breaking change is a new name.
- **`encounters` is partitioned by `received`.** A client's clock is untrusted: a batch spread
  over a hundred months would be a hundred partitions in one insert, and a clock in the past would
  expire a row as it is written.
- **No `correlation`.** `entity`, `identity`, `trace` and declared fields join what belongs
  together; a column no producer fills by convention stays empty.
- **No pagination.** A query that needs more than the rows answered is one to aggregate.
- **The agent is classified by the extension, not by a library.** Three names from a short list
  of patterns, without versions, which browsers freeze anyway: a dependency would track every
  browser's every release for an answer a question of who visits does not ask.
- **No `Referer`.** A request from the storefront to the gateway's origin carries the storefront's
  origin and no more, and the page a visitor came from is `document.referrer`, which only the
  client reads.
- **A guide in `describe`, not a skill.** An agent that reads the log does so over MCP, with no
  repository at hand, and a skill installed apart from a deployment tells of another version.
  `describe` is what it calls first: how to read the log is the extension's text, how to read the
  store the provider's, and what is particular to the application is in its descriptions.
- **The database is the scope.** Every other store a context shares — MongoDB, the brokers, Redis
  — is named by `TOA_CONTEXT` and `TOA_SUFFIX`, and the store of the log is one more: its address
  names a server, and the database is the scope. Two contexts cannot write to one database by
  mistake, and the deployments of one context are told apart as they are everywhere else.
- **No tenancy in Toa.** One context reading the logs of others — a platform and the applications
  it runs — is a grant of the store's administrator, which provisioning leaves in place; Toa grants
  a reader its own database and nothing more.
- **Every time is its source's, none the store's.** A change is when it was made: the payload's
  timestamp, `UPDATED` by default, or else the moment the process made it, which every message
  now carries, stamped on the operation's path so that the outbox publishing it later does not
  move it. A store's clock tells when a row arrived, which is no answer to a question of when
  anything happened, and moves with every outage of the scribe.
- **An encounter is on the gateway's clock.** A client's clock is wrong by an unknown amount; the
  distance it measures between its own moments is not. `sent` and `time` give that distance, and
  the gateway's receipt the absolute time, as the analytics of browsers commonly do.
- **No backlog in `describe`.** It would be a request to the broker on every call; the newest
  latest `time` tells whether the log is being written.

## Context

[Chronicles](./chronicles.md), and a review of the log as a source for autonomous analytics.

## Compatibility

Chronicles has not been released: the declaration, the annotation, the routes and the tables
change without a migration.
