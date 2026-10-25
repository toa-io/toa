# Reading the log

The log is three tables: `events`, `states` and `encounters`. Every row has `scope`, the
application it is of; you read the rows of yours.

- `events`: a row for everything a component did. `label` is `<component>.<event>` for a change,
  with the `entity` that changed and its `version`, or `<component>.<name>` for a fact, with
  neither. `identity` is whose the row is, where the component says; `trace` is the call that
  caused it.
- `states`: each entity as it stands now, by `component` and `entity`, at its latest `version`.
  Nothing before it is kept: what an entity was at a time in the past is read from its events.
- `encounters`: what clients sent, by `name`. `visitor` is the client's id of itself, kept across
  sessions; `session` is one period of its activity; `identity` is set where a signed-in client
  sent it. `ip` is the client's network, `country` its country, `origin` the site it was sent from,
  `agent` its `user-agent`, and `browser`, `os` and `device` what the agent says it is.

## Time

Every row has `time`, when it happened, on the server's clock. No column is when the store wrote a
row.

- A change, in `events` and `states`: when the component made it — the entity's `UPDATED`, or the
  property the component names, or else the moment of the change.
- A fact: when the operation sent it.
- An encounter: when the gateway received its batch, less how long before sending the batch the
  client says the event happened. A client's clock may be off by minutes or years; what it
  measures between two of its own moments is not. So `time` is the gateway's clock at the
  distance the client measured: the order and the intervals of one client's encounters are exact,
  and so is when they happened, to the time a request takes to arrive. A batch a client held
  while offline is written at when its events happened.

An encounter also has `received`, when the gateway received its batch: one `received` is shared by
every encounter of a batch, and a `received` far behind now means clients stopped sending.

Rows can arrive late — after the service that writes them was away — and are written at their own
time, so a count of the last hours may still grow. Compare `time` of encounters and of events
directly: both are the server's.

A declared label's payload holds only what is declared. `chronicles.queries.GET` tells each
declared field's type, what it means, and `read`: the expression that selects it from the table
in its type — use it rather than casting the payload yourself. An encounter's
payload is what the client sent, and its fields differ between versions of a client: two types of
one field are two versions.

A visitor is not a person: one identity may have many visitors, and a browser that clears its
storage is a new one. The visitors of an identity are the rows that have both. Leave out
`device = 'bot'` from any question of who visits. Safari on an iPad reports a desktop Mac.

Nothing arrives in order: order by `time`, or by `version` within one entity. A view another agent
defined says what it counts in its title and description; read them before reusing one, and give
your own views both. A view is read by its name, which `chronicles.queries.GET` tells with its
database.
