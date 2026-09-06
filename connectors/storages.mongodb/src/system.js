/**
 * Migrations the runtime owns, applied to every collection ahead of whatever the component
 * declares.
 *
 * These convert what the runtime itself writes, so they are declared here rather than in a
 * migration every component would have to write — the same reason the outbox keeps its own
 * indexes. A component cannot write them: it does not own the system properties, and a
 * prototype's migrations are not inherited.
 *
 * They are applied once for the database, recorded beside the component's own, and named so
 * that the two can never collide.
 */
export const SYSTEM = [
  {
    id: 'system:0001-epoch-millis',
    steps: [
      {
        /*
         * The system timestamps became dates: what sorts, compares and expires as a moment
         * rather than as a number that happens to be one. A record written before this holds
         * them as milliseconds, and a collection holding both would sort every number ahead of
         * every date — so the release that brings this stops the deployment first.
         *
         * `CREATED` says whether a record has been converted, because every record has one.
         * Null passes through both conversions, which is what an undeleted record's `DELETED`
         * is; and the widening is not decoration — MongoDB makes a date from a long and
         * refuses one from an int, and a small enough millisecond is stored as an int.
         */
        update: {
          filter: { CREATED: { $type: 'number' } },
          update: [
            {
              $set: {
                CREATED: { $toDate: { $toLong: '$CREATED' } },
                UPDATED: { $toDate: { $toLong: '$UPDATED' } },
                DELETED: { $toDate: { $toLong: '$DELETED' } }
              }
            }
          ]
        }
      }
    ]
  }
]
