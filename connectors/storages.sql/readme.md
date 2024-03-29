# SQL Connector

## TL;DR

```yaml
sql: pg://host0.example.com/production
```

---

## Supported Databases

Implemented using [Knex](https://knexjs.org), therefore could support same databases.

> ![Important](https://img.shields.io/badge/Important-red)<br/>
> Integrations only with PostgreSQL and Amazon Redshift are tested and `pg` is the only driver
> installed.

## Annotation

Uses [Pointer Annotation](/libraries/pointer/readme.md#annotation).

### Drivers

Pointer annotation URIs must contain protocol identifying the driver to access the database.

| Protocol     | Database                                    |
|--------------|---------------------------------------------|
| `pg:`        | PostgreSQL, CockroachDB and Amazon Redshift |
| `mysql:`     | MySQL or MariaDB                            |
| `tedious:`   | MSSQL                                       |

See [Knex documentation](https://knexjs.org/guide/) for details.

### Database, Schema, Table

Pointer annotation URIs must contain path following convention `/database/schema/table`, where table
and schema are optional. Default values for `schema` and `table` are component's namespace and name
respectively.

> Namespace-wide or `default` values must not contain table name and `default` value must not
> contain schema.

#### Local Environment

On local environment protocol is `pg:`. Database name can be set by `TOA_STORAGES_SQL_DATABASE`
environment variable. Also see
Pointer's [local environment](/libraries/pointer/readme.md#local-environment).

> PostgreSQL is using `username`'s value as default name for the database and Pointer is
> using `developer` as default username on local environment. That is, default database name on
> local environment is `developer`.

### Examples

```yaml
sql:
  default: pg://host0.example.com:5432/production
  dummies.dummy: mysql://host1.example.com/marketing/stats/dummies
```

## Migration

> Migration only supports local environments and is used for development and testing purposes.

See [tests](test/migration.test.js) for details.
