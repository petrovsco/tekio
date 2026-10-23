import type { StartRows, StartSettings } from '@tekio/db'
import { api, body } from '../api'

// Every row the app opens with, and its profile and sections, in one call to
// the API (RFC 0094 step 4). It replaced a query a table straight from the
// database once the two were timed on real start-ups: from a phone, the
// queries waited on the round trip to the database one by one, while beside it
// in Dublin they answer in tens of milliseconds each.
export const loadStart = (): Promise<StartRows & StartSettings> =>
  // The description types a sport's rating as a plain number, since an
  // unrated one is 0; the API's schema is held to `StartRows` itself.
  body(api.GET('/api/start')) as Promise<StartRows & StartSettings>
