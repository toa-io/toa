# Installation

Toa is one Node.js package, `@toa.io/runtime`, and it talks to a message broker, a database and a
Redis that run beside it. An application installs the package; Docker runs the rest.

## Node.js

Node.js 24 or later. Nothing is compiled: a component's code, JavaScript or TypeScript, is read by
Node as it is written.

## The runtime

```shell
$ npm i -D @toa.io/runtime@alpha
$ npx toa -v
1.0.0-alpha.285
```

`@toa.io/runtime` is the whole of Toa: the `toa` command, the runtime, every connector and every
extension. Installed globally, `npm i -g @toa.io/runtime@alpha`, it puts `toa` on the path.

Every `@toa.io/*` package is released at one version. A second package an application adds,
`@toa.io/userland` for tests, an extension for its types, is installed at the same tag and
upgraded together with the runtime, as [Upgrading](../7-deploy/03-upgrade.md) does. The current
line is published under the `alpha` tag; `latest` still names the previous line, and is not what a
new application takes.

## Infrastructure

Calls and events travel over AMQP, entities live in MongoDB, and what replicas decide together,
which of them owns a schedule or counts a rate, is arbitrated by Redis. On one machine all three
are containers:

```yaml
# docker-compose.yaml
services:
  rabbitmq:
    image: rabbitmq:4.2.4-management
    ports: ["5672:5672", "15672:15672"]
    environment:
      RABBITMQ_DEFAULT_USER: developer
      RABBITMQ_DEFAULT_PASS: secret

  mongodb:
    image: mongo:8.0.16
    ports: ["27017:27017"]
    environment:
      MONGO_INITDB_ROOT_USERNAME: developer
      MONGO_INITDB_ROOT_PASSWORD: secret
    volumes:
      - mongo-data:/data/db
      - mongo-key:/etc/mongo-keyfile
    entrypoint: >
      bash -lc '
        set -e
        if [ ! -f /etc/mongo-keyfile/keyfile ]; then
          umask 077
          openssl rand -base64 756 > /etc/mongo-keyfile/keyfile
          chmod 400 /etc/mongo-keyfile/keyfile
          chown 999:999 /etc/mongo-keyfile/keyfile
        fi
        exec /usr/local/bin/docker-entrypoint.sh mongod \
          --replSet rs0 --bind_ip_all --keyFile /etc/mongo-keyfile/keyfile
      '
    healthcheck:
      test: >
        bash -lc '
          mongosh "mongodb://developer:secret@localhost:27017/admin?directConnection=true" \
            --quiet --eval "
              try { rs.status().ok } catch (e) {
                rs.initiate({ _id: \"rs0\", members: [{ _id: 0, host: \"localhost:27017\" }] })
              };
              db.runCommand({ ping: 1 }).ok
            " | grep 1
        '
      interval: 10s
      timeout: 5s
      retries: 30

  redis:
    image: redis:8.6.1
    ports: ["6379:6379"]

volumes:
  mongo-data:
  mongo-key:
```

```shell
$ docker compose up -d
```

MongoDB runs as a replica set of one, because a state change and the events it raises commit in
one transaction, and a transaction needs a replica set. The key file it needs is generated on the
first start and kept in a volume.

With `TOA_DEV=1` in the environment, every connector resolves to these containers:
`amqp://developer:secret@localhost`, `mongodb://developer:secret@localhost` with the database
`toa-dev`, and `redis://localhost`. Nothing is configured until the Context says something else,
which [Running](../6-workflow/01-run.md) covers.

## Deployment tools

`docker`, `kubectl` and `helm` are used by `toa build` and `toa deploy` alone, and are needed
when [Deploy](../7-deploy/readme.md) is.

---

[← Concepts](01-concepts.md) · [Start](readme.md) · [First application →](03-first-app.md)
