import { Before } from '@cucumber/cucumber'

/**
 * The Cloudinary scenarios upload to a real account, named by `features/steps/.env` — the
 * environment and the keys `.env.example` lists. A checkout carries none, and an account is
 * not something a run can stand up for itself, the way the compose file stands up a database.
 * Without one the scenarios are skipped rather than failed, so `npm run features` answers on a
 * fresh machine; with one they run, no flag to remember.
 */
Before({ tags: '@cloudinary' }, function () {
  if (process.env.CLOUDINARY_ENVIRONMENT === undefined)
    return 'skipped'
})
