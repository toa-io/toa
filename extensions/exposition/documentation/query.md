# Query mapping

## TL;DR

```yaml
id?: string
criteria?: string
sort?: string
omit?: integer
limit?: integer
selectors?: string[]
projection?: string[]
```

```yaml
# manifest.toa.yaml

name: pots
namespace: tea

exposition:
  /hot:
    GET:
      endpoint: enumerate
      query:
        criteria: state==hot
    /top10:
      GET:
        endpoint: enumerate
        query:
          criteria: state==hot
          sort: rank:desc
          limit: 10
  /latest:
    GET:
      endpoint: observe
      query:
        sort: timestamp:desc
        limit: 1
```

Undefined `query` denies any query arguments in requests.

`POST` method mapping cannot have `query` declaration.

## Criteria

Search criteria in [RSQL](https://github.com/jirutka/rsql-parser) format.

The `criteria` property is considered as *open* when it ends with a `;`, allowing the combination of
request query criteria using `and` logic.
Otherwise, criteria property is *closed*, that is, doesn't allow `criteria` in a request query.

```yaml
# manifest.toa.yaml

name: dummy

exposition:
  /:
    GET:
      endpoint: observe
      query:
        criteria: state==hot; # open criteria
```

```http
GET /dummies/?criteria=rank==5
```

The request example above will result in an operation call with the following Request:

```yaml
query:
  criteria: state==hot;rank=5
```

### Path variables

Path variables are prepended to the `criteria` request query parameter except for
the [`POST` method](#post-method).

If query criteria starts with logical operator (`,` or `;`), then path variables are prepended
accordingly.
`AND` logical operator is used by default.

Given the following declaration:

```yaml
# manifest.toa.yaml

name: dummies

exposition:
  /:type:
    GET:
      endpoint: observe
      query:
        criteria: ,state==hot; # open criteria
```

and the following request:

```http request
GET /dummies/cool/?criteria=rank==5
```

Operation call will have the following query criteria:

```yaml
criteria: (type==cool,state==hot);(rank=5)
```

#### POST method

`POST` method semantically used to create a new entity instance, that is, calling a Transition
without Query.
Thus, path variables are added to the request input.

Given the following declaration:

```yaml
# manifest.toa.yaml

name: dummies

exposition:
  /:type:
    POST: transit
```

and the following request:

```http request
POST /dummies/cool/
content-type: application/yaml

input:
  rank: 5
```

Operation call will have the following input:

```yaml
type: cool
rank: 5
```

> In case of conflict, path variables override input properties.

## Omit, limit

`omit` and `limit` properties can declare their default values and allowed boundaries:

```yaml
limit:
  value: 10
  range: [1, 100]
```

If no default value is provided, then the lower boundary of the range is used.

Default values for `omit` and `limit` are:

```yaml
omit:
  value: 0
  range: [0, 1000]
limit:
  value: 10
  range: [1, 1000]
```

Constant values can be declared using the shortcut:

```yaml
limit: 10
```

```http
GET /dummies/?omit=100&limit=10
```

## Sort

The `sort` query property defines the result order of Observations within an `objects` scope
(enumeration).
It comprises an ordered set of sorting statements delimited by semicolons.
Each statement consists of an entity property name with an optional sorting direction suffix:
`:asc`for ascending or `:desc` for descending.

```yaml
sort: rank # ascending by default
```

```yaml
sort: rank:asc
```

```yaml
sort: rank:desc;timestamp:asc
```

If `sort` value ends with a semicolon `;` then the sorting is considered *open*
and can be extended using request query `sort` argument.

```yaml
sort: rank:desc; # open sort
```

Having the above `sort` declaration, the following request will result in an operation call
with `rank:desc;timestamp:asc` sort:

```http
GET /dummies/?sort=timestamp:asc
```

## Selectors

![Not implemented](https://img.shields.io/badge/Not_implemented-red)

The `selectors` query property contains a list of Entity properties allowed for a client to use in
the `criteria` and `sort` query parameters.
If no value is provided, then no selectors are allowed.

```yaml
selectors: [rank, timestamp]
```

## Projection

A list of Entity properties to be included in the Observation result.

```yaml
projection: [id, title, timestamp]
```

## Parameters

By default, the only query parameters allowed are described above. Arbitrary query parameters
can be allowed by specifying them in the `parameters` property.

```yaml
parameters: [foo, bar]
```

These parameters are embedded in the operation call input, which must be an object.

```http
GET /dummies/?foo=0&bar=baz
```

## Optimistic concurrency control

If an operation returns an object with `_version` property,
then its value is passed as the value of
the [`etag` header](https://datatracker.ietf.org/doc/html/rfc7232#section-2.3) in the response
(and removed from the object).

Client can use the `if-match` request header to perform an operation only if the corresponding
object has not been modified since the last retrieval.

```http
GET /dummies/5e82ed5e/ HTTP/1.1

---

HTTP/1.1 200 OK
etag: "1"

foo: bar
```

```http request
PUT /dummies/5e82ed5e/ HTTP/1.1
if-match: "1"

foo: baz
```

```http
200 OK
```

```http request
PUT /dummies/5e82ed5e/ HTTP/1.1
if-match: "never"

foo: baz
```

```http
412 Precondition Failed
```

The value within the quotes is mapped to the `version` property of operation call query.
