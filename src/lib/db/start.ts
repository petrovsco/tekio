import * as db from '@tekio/db'
import { appDb } from './_rows'
import { api, body } from '../api'

// Every row the app opens with, by one of two roads while they are measured
// against each other (RFC 0094 step 4): straight from the database, a query a
// table, or `?start=api` in the address, one call to the API beside it. The
// slower road is deleted once timed.
const viaApi = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('start') === 'api'

export const loadStart = (): Promise<db.StartRows> =>
  // The description types a sport's rating as a plain number, since an
  // unrated one is 0; the API's schema is held to `StartRows` itself.
  viaApi() ? body(api.GET('/api/start')) as Promise<db.StartRows> : db.loadStartRows(appDb())
