# Reading the log

The log is three tables, and a view for each label and state the components declare.

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

Every row has `time`, when it happened, and `received`, when the store wrote it. An encounter's
`time` is the client's clock, which may be wrong; `received` is not. A `received` far behind now
means rows stopped arriving, not that nothing happened.

Read a declared label through its view, named after the label with its dots as underscores
(`store.orders.paid` is `store_orders_paid`, the state of `store.orders` is `store_orders`): its
columns are the declared fields in their types, and the description of each is in what
`chronicles.queries.GET` answers. A label's payload holds only what is declared. An encounter's
payload is what the client sent, and its fields differ between versions of a client: two types of
one field are two versions.

A visitor is not a person: one identity may have many visitors, and a browser that clears its
storage is a new one. The visitors of an identity are the rows that have both. Leave out
`device = 'bot'` from any question of who visits. Safari on an iPad reports a desktop Mac.

Nothing arrives in order: order by `time`, or by `version` within one entity. A view another agent
defined says what it counts in its title and description; read them before reusing one, and give
your own views both.
