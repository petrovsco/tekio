/** An error the app expects and explains to the person: an entry refused for
 *  what it holds, not a fault. The web app never reports one (RFC 0103), and
 *  the API answers one with a 400 carrying its message (RFC 0094). */
export class KnownError extends Error {
  name = 'KnownError'
}
