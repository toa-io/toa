# SQL Connector

Implemented with [Knex](https://knexjs.org), therefore supports the same set of databases:

## Annotation

Uses [Pointer Annotation](/libraries/pointer/readme.md#annotation). 

### Drivers

URI values must contain protocol identifying the driver to access the database.

| Protocol     | Database                                    |
|--------------|---------------------------------------------|
| `pg:`        | PostgreSQL, CockroachDB and Amazon Redshift |
| `mysql:`     | MySQL or MariaDB                            |
| `tedious:`   | MSSQL                                       |

See [Knex documentation](https://knexjs.org/guide/) for details.

> `pg` driver is pre-installed.

### Database

URI values must contain path with one segment identifying database name to connect to.

### Example

```yaml
sql: 
  default: pg://host0:5432/production
  dummies.dummy: mysql://host1/dummies
```
